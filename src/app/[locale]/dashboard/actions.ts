'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { redirect } from 'next/navigation';
import { isRedirectError } from 'next/dist/client/components/redirect';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { isAdminUser } from '@/lib/auth/admin';

const PROJECT_THUMBNAIL_BUCKET = 'portfolio-thumbnails';
const MAX_THUMBNAIL_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
]);
const ALLOWED_IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp', 'avif']);
const PROJECT_STATUS_VALUES = ['idea', 'design', 'development', 'completed', 'on_hold'] as const;

const projectFormSchema = z.object({
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().min(1).max(500),
  content_md: z.string().trim().max(200_000),
  status: z.enum(PROJECT_STATUS_VALUES),
  is_published: z.boolean(),
});

const activeProjectFormSchema = z.object({
  name: z.string().trim().min(1).max(120),
  stage: z.number().int().min(0).max(4),
  display_order: z.number().int().min(0).max(999),
  is_published: z.boolean(),
});
const contentBlockSchema = z.object({
  type: z.string().trim().min(1).max(60),
}).passthrough();
const contentJsonSchema = z.array(contentBlockSchema).max(2000);

function parseBoolean(value: FormDataEntryValue | null) {
  return value === 'on' || value === 'true' || value === '1';
}

function parseInteger(value: FormDataEntryValue | null, fallback: number) {
  const parsed = Number(value ?? fallback);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseJson(value: FormDataEntryValue | null) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed);
  } catch {
    return null;
  }
}

function parseProjectContentJson(value: FormDataEntryValue | null) {
  const parsed = parseJson(value);
  if (parsed == null) return null;

  const validated = contentJsonSchema.parse(parsed);
  const serializedSize = new TextEncoder().encode(JSON.stringify(validated)).byteLength;
  if (serializedSize > 1_000_000) {
    throw new Error('Project content JSON is too large.');
  }
  return validated;
}

function getFileExtension(fileName: string, fallback = 'jpg') {
  const rawExt = fileName.split('.').pop()?.toLowerCase() ?? fallback;
  return rawExt.replace(/[^a-z0-9]/g, '') || fallback;
}

function assertImageFile(file: File) {
  if (file.size <= 0) return;
  if (file.size > MAX_THUMBNAIL_FILE_SIZE) {
    throw new Error('Thumbnail file is too large. Max 5MB.');
  }

  const extension = getFileExtension(file.name);
  if (!ALLOWED_IMAGE_MIME_TYPES.has(file.type) || !ALLOWED_IMAGE_EXTENSIONS.has(extension)) {
    throw new Error('Invalid thumbnail format. Use JPG, PNG, WEBP, or AVIF.');
  }
}

async function requireAdminUserId() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) {
    throw new Error('Not authenticated');
  }
  if (!(await isAdminUser(authData.user.id))) {
    throw new Error('Forbidden');
  }
  return { supabase, userId: authData.user.id };
}

async function uploadProjectThumbnail({
  supabase,
  userId,
  projectId,
  file,
}: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  userId: string;
  projectId: string;
  file: File;
}) {
  if (file.size <= 0) return null;
  assertImageFile(file);
  const safeExt = getFileExtension(file.name);
  const path = `${userId}/${projectId}-${Date.now()}.${safeExt}`;

  const { error: uploadError } = await supabase.storage
    .from(PROJECT_THUMBNAIL_BUCKET)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: true,
      contentType: file.type || undefined,
    });

  if (uploadError) throw new Error(uploadError.message);

  const { data } = supabase.storage
    .from(PROJECT_THUMBNAIL_BUCKET)
    .getPublicUrl(path);

  return data.publicUrl;
}

function redirectWithToast(path: string, toastCode: string) {
  redirect(`${path}${path.includes('?') ? '&' : '?'}toast=${toastCode}&toastAt=${Date.now()}`);
}

export async function createProjectAction(locale: string, formData: FormData) {
  try {
    const { supabase, userId } = await requireAdminUserId();
    const input = projectFormSchema.parse({
      title: String(formData.get('title') ?? ''),
      description: String(formData.get('description') ?? ''),
      content_md: String(formData.get('content_md') ?? ''),
      status: String(formData.get('status') ?? 'idea'),
      is_published: parseBoolean(formData.get('is_published')),
    });

    const { data: createdProject, error: createError } = await supabase
      .from('portfolio_projects')
      .insert({
        user_id: userId,
        title: input.title,
        description: input.description,
        content_md: input.content_md,
        content_json: parseProjectContentJson(formData.get('content_json')),
        status: input.status,
        is_published: input.is_published,
      })
      .select('id')
      .single();

    if (createError || !createdProject) {
      throw new Error(createError?.message ?? 'Failed to create project');
    }

    const thumbnail = formData.get('thumbnail');
    if (thumbnail instanceof File && thumbnail.size > 0) {
      assertImageFile(thumbnail);
      const thumbnailUrl = await uploadProjectThumbnail({
        supabase,
        userId,
        projectId: createdProject.id,
        file: thumbnail,
      });

      if (thumbnailUrl) {
        const { error: thumbnailUpdateError } = await supabase
          .from('portfolio_projects')
          .update({ thumbnail_url: thumbnailUrl })
          .eq('id', createdProject.id)
          .eq('user_id', userId);

        if (thumbnailUpdateError) {
          throw new Error(thumbnailUpdateError.message);
        }
      }
    }

    revalidatePath('/', 'layout');
    revalidateTag('home-page-data');
    redirect(`/${locale}/dashboard?tab=projects&toast=project_created&toastAt=${Date.now()}`);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    redirectWithToast(`/${locale}/dashboard/projects/new`, 'project_create_failed');
  }
}

export async function updateProjectAction(locale: string, projectId: string, formData: FormData) {
  try {
    const { supabase, userId } = await requireAdminUserId();
    const input = projectFormSchema.parse({
      title: String(formData.get('title') ?? ''),
      description: String(formData.get('description') ?? ''),
      content_md: String(formData.get('content_md') ?? ''),
      status: String(formData.get('status') ?? 'idea'),
      is_published: parseBoolean(formData.get('is_published')),
    });

    let thumbnailUrl: string | null = null;
    const thumbnail = formData.get('thumbnail');
    if (thumbnail instanceof File && thumbnail.size > 0) {
      assertImageFile(thumbnail);
      thumbnailUrl = await uploadProjectThumbnail({
        supabase,
        userId,
        projectId,
        file: thumbnail,
      });
    }

    const { data: updatedProject, error: updateError } = await supabase
      .from('portfolio_projects')
      .update({
        title: input.title,
        description: input.description,
        content_md: input.content_md,
        content_json: parseProjectContentJson(formData.get('content_json')),
        status: input.status,
        is_published: input.is_published,
        ...(thumbnailUrl ? { thumbnail_url: thumbnailUrl } : {}),
      })
      .eq('id', projectId)
      .select('id')
      .maybeSingle();

    if (updateError) {
      throw new Error(updateError.message);
    }

    if (!updatedProject) {
      throw new Error('Project not found.');
    }

    revalidatePath('/', 'layout');
    revalidateTag('home-page-data');
    redirect(`/${locale}/dashboard?tab=projects&toast=project_updated&toastAt=${Date.now()}`);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    redirectWithToast(`/${locale}/dashboard/projects/${projectId}`, 'project_update_failed');
  }
}

export async function deleteProjectAction(locale: string, projectId: string) {
  try {
    const { supabase } = await requireAdminUserId();

    const { data: deletedProject, error: deleteError } = await supabase
      .from('portfolio_projects')
      .delete()
      .eq('id', projectId)
      .select('id')
      .maybeSingle();

    if (deleteError) {
      throw new Error(deleteError.message);
    }

    if (!deletedProject) {
      throw new Error('Project not found.');
    }

    revalidatePath('/', 'layout');
    revalidateTag('home-page-data');
    redirect(`/${locale}/dashboard?tab=projects&toast=project_deleted&toastAt=${Date.now()}`);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    redirectWithToast(`/${locale}/dashboard?tab=projects`, 'project_delete_failed');
  }
}

export async function createActiveProjectAction(locale: string, formData: FormData) {
  try {
    const { supabase, userId } = await requireAdminUserId();
    const input = activeProjectFormSchema.parse({
      name: String(formData.get('name') ?? ''),
      stage: parseInteger(formData.get('stage'), 0),
      display_order: parseInteger(formData.get('display_order'), 0),
      is_published: parseBoolean(formData.get('is_published')),
    });

    const { data: createdProject, error: createError } = await supabase
      .from('portfolio_active_projects')
      .insert({
        user_id: userId,
        name: input.name,
        stage: input.stage,
        display_order: input.display_order,
        is_published: input.is_published,
      })
      .select('id')
      .maybeSingle();

    if (createError) {
      throw new Error(createError.message);
    }

    if (!createdProject) {
      throw new Error('Failed to create active project.');
    }

    revalidatePath('/', 'layout');
    revalidateTag('home-page-data');
    redirect(`/${locale}/dashboard?tab=active&toast=active_created&toastAt=${Date.now()}`);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    redirectWithToast(`/${locale}/dashboard?tab=active`, 'active_create_failed');
  }
}

export async function updateActiveProjectAction(locale: string, projectId: string, formData: FormData) {
  try {
    const { supabase } = await requireAdminUserId();
    const input = activeProjectFormSchema.parse({
      name: String(formData.get('name') ?? ''),
      stage: parseInteger(formData.get('stage'), 0),
      display_order: parseInteger(formData.get('display_order'), 0),
      is_published: parseBoolean(formData.get('is_published')),
    });

    const { data: updatedProject, error: updateError } = await supabase
      .from('portfolio_active_projects')
      .update({
        name: input.name,
        stage: input.stage,
        display_order: input.display_order,
        is_published: input.is_published,
      })
      .eq('id', projectId)
      .select('id')
      .maybeSingle();

    if (updateError) {
      throw new Error(updateError.message);
    }

    if (!updatedProject) {
      throw new Error('Active project not found.');
    }

    revalidatePath('/', 'layout');
    revalidateTag('home-page-data');
    redirect(`/${locale}/dashboard?tab=active&toast=active_updated&toastAt=${Date.now()}`);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    redirectWithToast(`/${locale}/dashboard?tab=active`, 'active_update_failed');
  }
}

export async function deleteActiveProjectAction(locale: string, projectId: string) {
  try {
    const { supabase } = await requireAdminUserId();

    const { data: deletedProject, error: deleteError } = await supabase
      .from('portfolio_active_projects')
      .delete()
      .eq('id', projectId)
      .select('id')
      .maybeSingle();

    if (deleteError) {
      throw new Error(deleteError.message);
    }

    if (!deletedProject) {
      throw new Error('Active project not found.');
    }

    revalidatePath('/', 'layout');
    revalidateTag('home-page-data');
    redirect(`/${locale}/dashboard?tab=active&toast=active_deleted&toastAt=${Date.now()}`);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    redirectWithToast(`/${locale}/dashboard?tab=active`, 'active_delete_failed');
  }
}

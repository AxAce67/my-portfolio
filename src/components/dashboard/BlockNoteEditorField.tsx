'use client';

import { useEffect, useMemo, useState } from 'react';
import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/mantine';
import { useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import { createClient } from '@/lib/supabase/client';

const EDITOR_ASSETS_BUCKET = 'portfolio-editor-assets';
const MAX_EDITOR_UPLOAD_SIZE = 5 * 1024 * 1024;
const ALLOWED_UPLOAD_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
]);
const ALLOWED_UPLOAD_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp', 'avif']);

type BlockNoteEditorFieldProps = {
  initialMarkdown?: string;
  initialContentJson?: unknown;
  onContentChange?: (payload: { contentJson: string; contentMd: string }) => void;
};

function normalizeBlocks(input: unknown) {
  return Array.isArray(input) ? input : undefined;
}

function getFileExtension(fileName: string, fallback = 'jpg') {
  const rawExt = fileName.split('.').pop()?.toLowerCase() ?? fallback;
  return rawExt.replace(/[^a-z0-9]/g, '') || fallback;
}

export default function BlockNoteEditorField({
  initialMarkdown,
  initialContentJson,
  onContentChange,
}: BlockNoteEditorFieldProps) {
  const t = useTranslations('Dashboard.editorForm');
  const { resolvedTheme } = useTheme();
  const supabase = useMemo(() => createClient(), []);
  const initialBlocks = useMemo(() => normalizeBlocks(initialContentJson), [initialContentJson]);
  const [contentJson, setContentJson] = useState<string>(
    initialBlocks ? JSON.stringify(initialBlocks) : '[]'
  );
  const [contentMd, setContentMd] = useState<string>(initialMarkdown ?? '');
  const [hydratedFromMarkdown, setHydratedFromMarkdown] = useState(false);

  const editor = useCreateBlockNote({
    initialContent: initialBlocks,
    uploadFile: async (file) => {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) {
        throw new Error(t('uploadAuthError'));
      }

      if (file.size > MAX_EDITOR_UPLOAD_SIZE) {
        throw new Error(t('uploadSizeError'));
      }

      const safeExt = getFileExtension(file.name);
      if (!ALLOWED_UPLOAD_MIME_TYPES.has(file.type) || !ALLOWED_UPLOAD_EXTENSIONS.has(safeExt)) {
        throw new Error(t('uploadTypeError'));
      }

      const path = `${authData.user.id}/${Date.now()}-${crypto.randomUUID()}.${safeExt}`;

      const { error: uploadError } = await supabase.storage
        .from(EDITOR_ASSETS_BUCKET)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type || undefined,
        });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      const { data } = supabase.storage.from(EDITOR_ASSETS_BUCKET).getPublicUrl(path);
      return data.publicUrl;
    },
  });

  useEffect(() => {
    if (initialBlocks) return;
    if (!initialMarkdown?.trim()) return;
    if (hydratedFromMarkdown) return;

    const blocks = editor.tryParseMarkdownToBlocks(initialMarkdown);
    if (blocks.length > 0) {
      editor.replaceBlocks(editor.document, blocks);
      setContentJson(JSON.stringify(editor.document));
      setContentMd(editor.blocksToMarkdownLossy());
    }
    setHydratedFromMarkdown(true);
  }, [editor, hydratedFromMarkdown, initialBlocks, initialMarkdown]);

  useEffect(() => {
    onContentChange?.({ contentJson, contentMd });
  }, [contentJson, contentMd, onContentChange]);

  return (
    <div className="space-y-2">
      <div className="rounded-lg border border-border overflow-hidden">
        <BlockNoteView
          className="project-editor-blocknote"
          editor={editor}
          onChange={() => {
            setContentJson(JSON.stringify(editor.document));
            setContentMd(editor.blocksToMarkdownLossy());
          }}
          theme={resolvedTheme === 'dark' ? 'dark' : 'light'}
        />
      </div>

      <input type="hidden" name="content_json" value={contentJson} />
      <input type="hidden" name="content_md" value={contentMd} />
      <p className="text-[11px] font-mono text-muted-foreground">
        {t('editorTipPrefix')} <code>/</code> {t('editorTipSuffix')}
      </p>
    </div>
  );
}

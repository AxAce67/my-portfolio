import { useEffect, useMemo, useState } from 'react';
import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView, lightDefaultTheme, darkDefaultTheme } from '@blocknote/mantine';
import { useTranslations } from '@/hooks/useTranslations';
import { useTheme } from '@/components/providers/ThemeProvider';
import { uploadImage, UploadValidationError } from '@/lib/appwrite/upload';

type BlockNoteEditorFieldProps = {
  initialMarkdown?: string;
  initialContentJson?: unknown;
  onContentChange?: (payload: { contentJson: unknown; contentMd: string }) => void;
};

function normalizeBlocks(input: unknown) {
  return Array.isArray(input) ? input : undefined;
}

// BlockNote ships as a self-contained "card" widget (white background,
// rounded corners) via theme CSS variables it sets inline on its own root —
// no amount of external CSS can win against that. Overriding the theme
// object itself (rather than fighting the variables) is the only way to make
// it sit flush/transparent like the rest of the article.
const articleLightTheme = {
  ...lightDefaultTheme,
  colors: { ...lightDefaultTheme.colors, editor: { ...lightDefaultTheme.colors.editor, background: 'transparent' } },
  borderRadius: 0,
};
const articleDarkTheme = {
  ...darkDefaultTheme,
  colors: { ...darkDefaultTheme.colors, editor: { ...darkDefaultTheme.colors.editor, background: 'transparent' } },
  borderRadius: 0,
};

export default function BlockNoteEditorField({
  initialMarkdown,
  initialContentJson,
  onContentChange,
}: BlockNoteEditorFieldProps) {
  const t = useTranslations('Dashboard.editorForm');
  const { resolvedTheme } = useTheme();
  const initialBlocks = useMemo(() => normalizeBlocks(initialContentJson), [initialContentJson]);
  const [hydratedFromMarkdown, setHydratedFromMarkdown] = useState(false);

  const editor = useCreateBlockNote({
    initialContent: initialBlocks,
    uploadFile: async (file) => {
      try {
        return await uploadImage(file);
      } catch (error) {
        if (error instanceof UploadValidationError && error.message === 'size') {
          throw new Error(t('uploadSizeError'), { cause: error });
        }
        if (error instanceof UploadValidationError && error.message === 'type') {
          throw new Error(t('uploadTypeError'), { cause: error });
        }
        throw new Error(t('uploadAuthError'), { cause: error });
      }
    },
  });

  useEffect(() => {
    if (initialBlocks) return;
    if (!initialMarkdown?.trim()) return;
    if (hydratedFromMarkdown) return;

    const blocks = editor.tryParseMarkdownToBlocks(initialMarkdown);
    if (blocks.length > 0) {
      editor.replaceBlocks(editor.document, blocks);
      onContentChange?.({ contentJson: editor.document, contentMd: editor.blocksToMarkdownLossy() });
    }
    setHydratedFromMarkdown(true);
  }, [editor, hydratedFromMarkdown, initialBlocks, initialMarkdown, onContentChange]);

  return (
    <div>
      <BlockNoteView
        className="project-editor-blocknote"
        editor={editor}
        onChange={() => {
          onContentChange?.({ contentJson: editor.document, contentMd: editor.blocksToMarkdownLossy() });
        }}
        theme={resolvedTheme === 'dark' ? articleDarkTheme : articleLightTheme}
      />
      <p className="text-[11px] font-mono text-muted-foreground mt-2">
        {t('editorTipPrefix')} <code>/</code> {t('editorTipSuffix')}
      </p>
    </div>
  );
}

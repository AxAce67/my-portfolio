'use client';

import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/mantine';
import { useTheme } from 'next-themes';

type BlockNoteRendererProps = {
  contentJson: unknown;
};

function normalizeBlocks(input: unknown) {
  return Array.isArray(input) ? input : [];
}

export default function BlockNoteRenderer({ contentJson }: BlockNoteRendererProps) {
  const { resolvedTheme } = useTheme();
  const blocks = normalizeBlocks(contentJson);
  const editor = useCreateBlockNote({
    initialContent: blocks,
    trailingBlock: false,
  });

  if (blocks.length === 0) {
    return <p className="text-sm text-muted-foreground">本文はまだありません。</p>;
  }

  return (
    <BlockNoteView
      editor={editor}
      editable={false}
      theme={resolvedTheme === 'dark' ? 'dark' : 'light'}
    />
  );
}

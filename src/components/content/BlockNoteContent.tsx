import React from 'react';

// BlockNote block / inline types (subset used in default schema)
type TextStyle = {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  code?: boolean;
  textColor?: string;
  backgroundColor?: string;
};

type TextContent = { type: 'text'; text: string; styles: TextStyle };
type LinkContent = { type: 'link'; href: string; content: TextContent[] };
type InlineContent = TextContent | LinkContent;

type TableContent = {
  type: 'tableContent';
  rows: Array<{ cells: InlineContent[][] }>;
};

type Block = {
  id: string;
  type: string;
  props: Record<string, unknown>;
  content: InlineContent[] | TableContent;
  children: Block[];
};

const BN_COLORS: Record<string, string> = {
  red: '#e03e3e',
  orange: '#d9730d',
  yellow: '#dfab01',
  green: '#4d6461',
  blue: '#0b6e99',
  purple: '#6940a5',
  pink: '#ad1a72',
  gray: '#787774',
};

function bnColor(name?: string) {
  if (!name || name === 'default') return undefined;
  return BN_COLORS[name] ?? name;
}

function InlineNodes({ content, prefix }: { content: InlineContent[]; prefix: string }) {
  return (
    <>
      {content.map((item, i) => {
        const key = `${prefix}-${i}`;
        if (item.type === 'link') {
          return (
            <a key={key} href={item.href} target="_blank" rel="noopener noreferrer">
              <InlineNodes content={item.content} prefix={`${key}-c`} />
            </a>
          );
        }
        const { text, styles } = item;
        if (!text) return null;

        const fg = bnColor(styles.textColor);
        const bg = bnColor(styles.backgroundColor);

        let node: React.ReactNode = text;
        if (styles.code) node = <code>{node}</code>;
        if (styles.bold) node = <strong>{node}</strong>;
        if (styles.italic) node = <em>{node}</em>;
        if (styles.underline) node = <u>{node}</u>;
        if (styles.strikethrough) node = <s>{node}</s>;

        if (fg || bg) {
          return (
            <span key={key} style={{ color: fg, backgroundColor: bg }}>
              {node}
            </span>
          );
        }
        return <React.Fragment key={key}>{node}</React.Fragment>;
      })}
    </>
  );
}

function BlockNodes({ blocks, prefix = 'b' }: { blocks: Block[]; prefix?: string }) {
  const elements: React.ReactNode[] = [];
  let i = 0;
  let listKey = 0;

  while (i < blocks.length) {
    const block = blocks[i];
    const key = `${prefix}-${i}`;

    // --- Grouped bullet list ---
    if (block.type === 'bulletListItem') {
      const items: React.ReactNode[] = [];
      while (i < blocks.length && blocks[i].type === 'bulletListItem') {
        const b = blocks[i];
        const bk = `${prefix}-${i}`;
        const bContent = Array.isArray(b.content) ? (b.content as InlineContent[]) : [];
        items.push(
          <li key={bk}>
            <InlineNodes content={bContent} prefix={bk} />
            {b.children.length > 0 && <BlockNodes blocks={b.children} prefix={`${bk}-ch`} />}
          </li>
        );
        i++;
      }
      elements.push(<ul key={`${prefix}-ul-${listKey++}`}>{items}</ul>);
      continue;
    }

    // --- Grouped numbered list ---
    if (block.type === 'numberedListItem') {
      const items: React.ReactNode[] = [];
      while (i < blocks.length && blocks[i].type === 'numberedListItem') {
        const b = blocks[i];
        const bk = `${prefix}-${i}`;
        const bContent = Array.isArray(b.content) ? (b.content as InlineContent[]) : [];
        items.push(
          <li key={bk}>
            <InlineNodes content={bContent} prefix={bk} />
            {b.children.length > 0 && <BlockNodes blocks={b.children} prefix={`${bk}-ch`} />}
          </li>
        );
        i++;
      }
      elements.push(<ol key={`${prefix}-ol-${listKey++}`}>{items}</ol>);
      continue;
    }

    // --- Grouped check list ---
    if (block.type === 'checkListItem') {
      const items: React.ReactNode[] = [];
      while (i < blocks.length && blocks[i].type === 'checkListItem') {
        const b = blocks[i];
        const bk = `${prefix}-${i}`;
        const bContent = Array.isArray(b.content) ? (b.content as InlineContent[]) : [];
        const checked = b.props.checked === true;
        items.push(
          <li key={bk} className="bn-check-item">
            <span className="bn-check-icon" aria-hidden="true">{checked ? '✓' : ''}</span>
            <span className={checked ? 'bn-check-text--done' : ''}>
              <InlineNodes content={bContent} prefix={bk} />
            </span>
            {b.children.length > 0 && <BlockNodes blocks={b.children} prefix={`${bk}-ch`} />}
          </li>
        );
        i++;
      }
      elements.push(<ul key={`${prefix}-cl-${listKey++}`} className="bn-check-list">{items}</ul>);
      continue;
    }

    // --- Single blocks ---
    const content = Array.isArray(block.content) ? (block.content as InlineContent[]) : [];
    const align = block.props.textAlignment as string | undefined;
    const style: React.CSSProperties = align && align !== 'left' ? { textAlign: align as React.CSSProperties['textAlign'] } : {};

    switch (block.type) {
      case 'heading': {
        const level = (block.props.level as number) ?? 2;
        const Tag = `h${Math.min(Math.max(level, 1), 6)}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
        elements.push(
          <Tag key={key} style={style}>
            <InlineNodes content={content} prefix={key} />
          </Tag>
        );
        break;
      }

      case 'paragraph':
        if (content.length === 0 || content.every(c => c.type === 'text' && !c.text)) {
          elements.push(<br key={key} />);
        } else {
          elements.push(
            <p key={key} style={style}>
              <InlineNodes content={content} prefix={key} />
            </p>
          );
        }
        break;

      case 'image': {
        const url = block.props.url as string | undefined;
        if (!url) break;
        const caption = block.props.caption as string | undefined;
        const width = block.props.previewWidth as number | undefined;
        elements.push(
          <figure key={key} className="bn-figure">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt={caption || ''}
              className="markdown-article-image"
              loading="lazy"
              style={width ? { width: `${width}px`, maxWidth: '100%' } : undefined}
            />
            {caption && <figcaption className="bn-figcaption">{caption}</figcaption>}
          </figure>
        );
        break;
      }

      case 'codeBlock': {
        const code = content.map(c => (c.type === 'text' ? c.text : '')).join('');
        elements.push(
          <pre key={key}>
            <code>{code}</code>
          </pre>
        );
        break;
      }

      case 'quote':
        elements.push(
          <blockquote key={key} style={style}>
            <InlineNodes content={content} prefix={key} />
            {block.children.length > 0 && <BlockNodes blocks={block.children} prefix={`${key}-ch`} />}
          </blockquote>
        );
        break;

      case 'table': {
        const tableContent = block.content as TableContent | undefined;
        if (!tableContent || tableContent.type !== 'tableContent') break;
        elements.push(
          <div key={key} className="bn-table-wrap">
            <table>
              <tbody>
                {tableContent.rows.map((row, ri) => (
                  <tr key={`${key}-r${ri}`}>
                    {row.cells.map((cell, ci) => (
                      <td key={`${key}-r${ri}c${ci}`}>
                        <InlineNodes content={cell} prefix={`${key}-r${ri}c${ci}`} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        break;
      }

      default:
        if (content.length > 0) {
          elements.push(
            <p key={key} style={style}>
              <InlineNodes content={content} prefix={key} />
            </p>
          );
        }
    }

    i++;
  }

  return <>{elements}</>;
}

export default function BlockNoteContent({ blocks }: { blocks: unknown }) {
  if (!Array.isArray(blocks) || blocks.length === 0) return null;
  return (
    <div className="markdown-article">
      <BlockNodes blocks={blocks as Block[]} />
    </div>
  );
}

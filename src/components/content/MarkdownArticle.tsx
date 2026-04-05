import React from 'react';
import { ContentLink } from '@/components/content/ContentLink';

type MarkdownArticleProps = {
  content: string;
};

function renderInline(text: string) {
  const parts: React.ReactNode[] = [];
  const pattern = /(`[^`]+`)|(!?\[[^\]]+\]\([^)]+\))/g;
  let lastIndex = 0;
  let key = 0;

  const pushStyledText = (value: string) => {
    const segments = value.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).filter(Boolean);
    for (const segment of segments) {
      if (segment.startsWith('**') && segment.endsWith('**')) {
        parts.push(<strong key={`inline-${key += 1}`}>{segment.slice(2, -2)}</strong>);
      } else if (segment.startsWith('*') && segment.endsWith('*')) {
        parts.push(<em key={`inline-${key += 1}`}>{segment.slice(1, -1)}</em>);
      } else if (segment) {
        parts.push(segment);
      }
    }
  };

  for (const match of Array.from(text.matchAll(pattern))) {
    const [token] = match;
    const start = match.index ?? 0;

    if (start > lastIndex) {
      pushStyledText(text.slice(lastIndex, start));
    }

    if (token.startsWith('`') && token.endsWith('`')) {
      parts.push(<code key={`inline-${key += 1}`}>{token.slice(1, -1)}</code>);
    } else if (token.startsWith('![')) {
      const imageMatch = token.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
      if (imageMatch) {
        const [, alt, src] = imageMatch;
        parts.push(
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={`inline-${key += 1}`}
            src={src}
            alt={alt}
            className="markdown-article-image"
            loading="lazy"
            decoding="async"
            width={1200}
            height={675}
          />
        );
      }
    } else {
      const linkMatch = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (linkMatch) {
        const [, label, href] = linkMatch;
        parts.push(
          <ContentLink key={`inline-${key += 1}`} href={href}>
            {label}
          </ContentLink>
        );
      }
    }

    lastIndex = start + token.length;
  }

  if (lastIndex < text.length) {
    pushStyledText(text.slice(lastIndex));
  }

  return parts;
}

export default function MarkdownArticle({ content }: MarkdownArticleProps) {
  const lines = content.replace(/\r\n/g, '\n').split('\n');
  const elements: React.ReactNode[] = [];
  let key = 0;
  let paragraphBuffer: string[] = [];
  let bulletItems: string[] = [];
  let orderedItems: string[] = [];
  let quoteItems: string[] = [];
  let codeBuffer: string[] = [];
  let inCodeBlock = false;

  const flushParagraph = () => {
    if (paragraphBuffer.length === 0) return;
    const text = paragraphBuffer.join(' ').trim();
    if (text) {
      elements.push(<p key={`block-${key += 1}`}>{renderInline(text)}</p>);
    }
    paragraphBuffer = [];
  };

  const flushBullets = () => {
    if (bulletItems.length === 0) return;
    elements.push(
      <ul key={`block-${key += 1}`}>
        {bulletItems.map((item, index) => <li key={`bullet-${key}-${index}`}>{renderInline(item)}</li>)}
      </ul>
    );
    bulletItems = [];
  };

  const flushOrdered = () => {
    if (orderedItems.length === 0) return;
    elements.push(
      <ol key={`block-${key += 1}`}>
        {orderedItems.map((item, index) => <li key={`ordered-${key}-${index}`}>{renderInline(item)}</li>)}
      </ol>
    );
    orderedItems = [];
  };

  const flushQuotes = () => {
    if (quoteItems.length === 0) return;
    elements.push(
      <blockquote key={`block-${key += 1}`}>
        {quoteItems.map((item, index) => <p key={`quote-${key}-${index}`}>{renderInline(item)}</p>)}
      </blockquote>
    );
    quoteItems = [];
  };

  const flushCode = () => {
    if (codeBuffer.length === 0) return;
    elements.push(
      <pre key={`block-${key += 1}`}>
        <code>{codeBuffer.join('\n')}</code>
      </pre>
    );
    codeBuffer = [];
  };

  const flushAll = () => {
    flushParagraph();
    flushBullets();
    flushOrdered();
    flushQuotes();
  };

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith('```')) {
      if (inCodeBlock) {
        flushCode();
        inCodeBlock = false;
      } else {
        flushAll();
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      continue;
    }

    if (!trimmed) {
      flushAll();
      continue;
    }

    const headingMatch = trimmed.match(/^(#{1,3})\s+(.*)$/);
    if (headingMatch) {
      flushAll();
      const level = headingMatch[1].length;
      const text = headingMatch[2];
      if (level === 1) elements.push(<h1 key={`block-${key += 1}`}>{renderInline(text)}</h1>);
      if (level === 2) elements.push(<h2 key={`block-${key += 1}`}>{renderInline(text)}</h2>);
      if (level === 3) elements.push(<h3 key={`block-${key += 1}`}>{renderInline(text)}</h3>);
      continue;
    }

    if (/^[-*]\s+/.test(trimmed)) {
      flushParagraph();
      flushOrdered();
      flushQuotes();
      bulletItems.push(trimmed.replace(/^[-*]\s+/, ''));
      continue;
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      flushParagraph();
      flushBullets();
      flushQuotes();
      orderedItems.push(trimmed.replace(/^\d+\.\s+/, ''));
      continue;
    }

    if (/^>\s?/.test(trimmed)) {
      flushParagraph();
      flushBullets();
      flushOrdered();
      quoteItems.push(trimmed.replace(/^>\s?/, ''));
      continue;
    }

    if (trimmed === '---') {
      flushAll();
      elements.push(<hr key={`block-${key += 1}`} />);
      continue;
    }

    paragraphBuffer.push(trimmed);
  }

  if (inCodeBlock) {
    flushCode();
  } else {
    flushAll();
  }

  if (elements.length === 0) {
    return <p className="text-sm text-muted-foreground">本文はまだありません。</p>;
  }

  return <div className="markdown-article">{elements}</div>;
}

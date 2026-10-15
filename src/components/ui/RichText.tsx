import React from 'react';

/**
 * Renders AI replies readably: paragraphs, "- " / "* " bullets, "#" headings and **bold**.
 * Built from React elements only (no HTML injection).
 */
function inline(text: string): React.ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**') ? <strong key={i}>{part.slice(2, -2)}</strong> : part
  );
}

export function RichText({ text, className = '' }: { text: string; className?: string }) {
  const blocks: React.ReactNode[] = [];
  let list: string[] = [];
  const flush = () => {
    if (list.length) {
      blocks.push(
        <ul key={`l${blocks.length}`} className="list-disc ps-5 space-y-1">
          {list.map((li, i) => <li key={i}>{inline(li)}</li>)}
        </ul>
      );
      list = [];
    }
  };
  for (const raw of String(text || '').split('\n')) {
    const line = raw.trim();
    if (/^[-*•]\s+/.test(line)) {
      list.push(line.replace(/^[-*•]\s+/, ''));
      continue;
    }
    flush();
    if (!line) continue;
    const heading = line.match(/^#{1,4}\s+(.*)$/);
    blocks.push(
      heading
        ? <p key={blocks.length} className="font-bold text-foreground">{inline(heading[1])}</p>
        : <p key={blocks.length}>{inline(line)}</p>
    );
  }
  flush();
  return <div className={`space-y-2 ${className}`}>{blocks}</div>;
}

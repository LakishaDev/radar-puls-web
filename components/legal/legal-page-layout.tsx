import {CircleX} from "lucide-react";
import type {LegalSection} from "@/lib/legal-content";

type LegalPageLayoutProps = {
  title: string;
  intro: string;
  sections: LegalSection[];
  lastUpdated?: string;
  emphasizeProhibited?: boolean;
};

type MarkdownBlock =
  | {type: "heading"; text: string}
  | {type: "paragraph"; text: string}
  | {type: "list"; items: string[]}
  | {type: "table"; headers: string[]; rows: string[][]};

export function LegalPageLayout({
  title,
  intro,
  sections,
  lastUpdated,
  emphasizeProhibited = false,
}: LegalPageLayoutProps) {
  return (
    <main className="mx-auto min-h-[70vh] w-full max-w-4xl px-4 py-12 text-[var(--rp-ink)] sm:px-6 lg:px-8">
      <header className="rounded-2xl border border-[var(--rp-border)] bg-[var(--rp-card)] p-6 sm:p-8">
        <h1 className="text-3xl font-semibold tracking-tight text-[var(--rp-deep)] sm:text-4xl">{title}</h1>
        <p className="mt-4 text-sm leading-7 text-[var(--rp-ink-soft)]">{intro}</p>
        {lastUpdated ? (
          <p className="mt-3 text-xs font-medium tracking-wide text-[var(--rp-ink-soft)]">{lastUpdated}</p>
        ) : null}
      </header>

      <div className="mt-8 space-y-8">
        {sections.map((section) => {
          const blocks = parseMarkdownBlocks(section.content);
          const isProhibitedSection = emphasizeProhibited && /prohibited|zabranjen|забрањен/i.test(section.heading);

          return (
            <section key={section.heading} className="rounded-2xl border border-[var(--rp-border)] bg-[var(--rp-card)] p-6 sm:p-8">
              <h2 className="text-xl font-semibold text-[var(--rp-deep)]">{section.heading}</h2>
              <div className="mt-4 space-y-4 text-sm leading-7 text-[var(--rp-ink-soft)]">
                {blocks.map((block, index) =>
                  renderBlock({
                    block,
                    key: `${section.heading}-${index}`,
                    emphasizeList: isProhibitedSection,
                  }),
                )}
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}

function renderBlock({
  block,
  key,
  emphasizeList,
}: {
  block: MarkdownBlock;
  key: string;
  emphasizeList: boolean;
}) {
  if (block.type === "heading") {
    return (
      <h3 key={key} className="text-base font-semibold text-[var(--rp-deep)]">
        {block.text}
      </h3>
    );
  }

  if (block.type === "paragraph") {
    return (
      <p key={key} className="leading-7">
        {renderInline(block.text)}
      </p>
    );
  }

  if (block.type === "list") {
    if (emphasizeList) {
      return (
        <ul key={key} className="space-y-2">
          {block.items.map((item) => (
            <li key={item} className="flex items-start gap-2 rounded-lg border border-rose-200/60 bg-rose-50/50 px-3 py-2 text-rose-900 dark:border-rose-900/50 dark:bg-rose-950/20 dark:text-rose-100">
              <CircleX className="mt-1 h-4 w-4 shrink-0" />
              <span>{renderInline(item)}</span>
            </li>
          ))}
        </ul>
      );
    }

    return (
      <ul key={key} className="space-y-2">
        {block.items.map((item) => (
          <li key={item} className="rounded-lg border border-[var(--rp-border)] bg-white/70 px-3 py-2 dark:bg-[var(--rp-card)]">
            {renderInline(item)}
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div key={key} className="overflow-x-auto rounded-xl border border-[var(--rp-border)]">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-[var(--rp-surface)] text-[var(--rp-deep)]">
          <tr>
            {block.headers.map((header) => (
              <th key={header} className="border-b border-[var(--rp-border)] px-3 py-2 font-semibold">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {block.rows.map((row, rowIndex) => (
            <tr key={`${key}-row-${rowIndex}`}>
              {row.map((cell, cellIndex) => (
                <td key={`${key}-row-${rowIndex}-cell-${cellIndex}`} className="border-b border-[var(--rp-border)] px-3 py-2 align-top">
                  {renderInline(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function parseMarkdownBlocks(content: string): MarkdownBlock[] {
  const lines = content.split(/\r?\n/);
  const blocks: MarkdownBlock[] = [];
  let cursor = 0;

  while (cursor < lines.length) {
    const line = lines[cursor].trim();

    if (!line) {
      cursor += 1;
      continue;
    }

    if (line.startsWith("### ")) {
      blocks.push({type: "heading", text: line.replace("### ", "").trim()});
      cursor += 1;
      continue;
    }

    if (line.startsWith("|")) {
      const tableLines: string[] = [];
      while (cursor < lines.length && lines[cursor].trim().startsWith("|")) {
        tableLines.push(lines[cursor].trim());
        cursor += 1;
      }
      const table = parseTable(tableLines);
      if (table) {
        blocks.push(table);
      }
      continue;
    }

    if (line.startsWith("- ")) {
      const items: string[] = [];
      while (cursor < lines.length && lines[cursor].trim().startsWith("- ")) {
        items.push(lines[cursor].trim().replace(/^-\s+/, ""));
        cursor += 1;
      }
      blocks.push({type: "list", items});
      continue;
    }

    const paragraphLines: string[] = [];
    while (cursor < lines.length) {
      const current = lines[cursor].trim();
      if (!current || current.startsWith("### ") || current.startsWith("- ") || current.startsWith("|")) {
        break;
      }
      paragraphLines.push(current);
      cursor += 1;
    }

    if (paragraphLines.length > 0) {
      blocks.push({type: "paragraph", text: paragraphLines.join(" ")});
    }
  }

  return blocks;
}

function parseTable(lines: string[]): MarkdownBlock | null {
  if (lines.length < 2) {
    return null;
  }

  const headers = splitTableRow(lines[0]);
  const separator = splitTableRow(lines[1]).every((cell) => /^-+$/.test(cell.replace(/\s+/g, "")));
  if (!separator) {
    return null;
  }

  const rows = lines.slice(2).map((line) => splitTableRow(line));
  return {
    type: "table",
    headers,
    rows,
  };
}

function splitTableRow(row: string) {
  return row
    .split("|")
    .map((cell) => cell.trim())
    .filter((cell, index, array) => !(index === 0 && cell === "") && !(index === array.length - 1 && cell === ""));
}

function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);

  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={`${part}-${index}`} className="font-semibold text-[var(--rp-deep)]">
          {part.slice(2, -2)}
        </strong>
      );
    }

    return <InlineText key={`${part}-${index}`} text={part} />;
  });
}

function InlineText({text}: {text: string}) {
  const chunks = text.split(/(https?:\/\/[^\s]+)/g).filter(Boolean);

  return (
    <>
      {chunks.map((chunk, index) => {
        if (/^https?:\/\//.test(chunk)) {
          return (
            <a key={`${chunk}-${index}`} href={chunk} target="_blank" rel="noreferrer" className="underline decoration-[var(--rp-primary)] underline-offset-2 hover:text-[var(--rp-primary)]">
              {chunk}
            </a>
          );
        }

        return <span key={`${chunk}-${index}`}>{chunk}</span>;
      })}
    </>
  );
}

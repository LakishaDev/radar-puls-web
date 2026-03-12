import {readFile} from "node:fs/promises";
import path from "node:path";

export type LegalLocale = "sr-latn" | "sr-cyrl" | "en";

export type LegalDocumentSlug =
  | "privacy"
  | "terms"
  | "disclaimer"
  | "cookies"
  | "community-guidelines"
  | "legal-hub";

export type LegalSection = {
  heading: string;
  content: string;
};

export type LegalDocument = {
  title: string;
  intro: string;
  lastUpdated?: string;
  sections: LegalSection[];
};

export type LegalHubCard = {
  title: string;
  icon: "Shield" | "FileText" | "Lock" | "Cookie" | "Users";
  route: string;
  description: string;
};

export type LegalHubContent = {
  title: string;
  intro: string;
  cards: LegalHubCard[];
  metadataTitle?: string;
  metadataDescription?: string;
};

export async function getLegalDocument(locale: LegalLocale, slug: Exclude<LegalDocumentSlug, "legal-hub">) {
  const raw = await readLegalMarkdown(locale, slug);
  return parseLegalDocument(raw);
}

export async function getLegalHubContent(locale: LegalLocale): Promise<LegalHubContent> {
  const raw = await readLegalMarkdown(locale, "legal-hub");
  return parseLegalHub(raw);
}

async function readLegalMarkdown(locale: LegalLocale, slug: LegalDocumentSlug) {
  const filePath = path.join(process.cwd(), "docs", "legal", `${slug}-${locale}.md`);
  return readFile(filePath, "utf8");
}

function parseLegalDocument(markdown: string): LegalDocument {
  const lines = markdown.split(/\r?\n/);
  const title = lines.find((line) => line.startsWith("# "))?.replace("# ", "").trim() ?? "";
  const lastUpdatedRaw = lines.find((line) => line.startsWith("*") && line.endsWith("*"));
  const lastUpdated = lastUpdatedRaw?.replace(/^\*|\*$/g, "").trim();

  const firstSectionIndex = lines.findIndex((line) => line.startsWith("## "));
  const introLines = firstSectionIndex > -1 ? lines.slice(0, firstSectionIndex) : lines;
  const intro = introLines
    .filter((line) => {
      const trimmed = line.trim();
      if (!trimmed) {
        return false;
      }
      if (trimmed.startsWith("# ")) {
        return false;
      }
      if (trimmed.startsWith("*") && trimmed.endsWith("*")) {
        return false;
      }
      return true;
    })
    .join(" ")
    .trim();

  const sections: LegalSection[] = [];
  let currentHeading = "";
  let currentBody: string[] = [];

  for (const line of lines) {
    if (line.startsWith("## ")) {
      if (currentHeading) {
        sections.push({heading: currentHeading, content: currentBody.join("\n").trim()});
      }
      currentHeading = line.replace("## ", "").trim();
      currentBody = [];
      continue;
    }

    if (currentHeading) {
      currentBody.push(line);
    }
  }

  if (currentHeading) {
    sections.push({heading: currentHeading, content: currentBody.join("\n").trim()});
  }

  return {
    title,
    intro,
    lastUpdated,
    sections,
  };
}

function parseLegalHub(markdown: string): LegalHubContent {
  const lines = markdown.split(/\r?\n/);
  const title = lines.find((line) => line.startsWith("# "))?.replace("# ", "").trim() ?? "";

  const firstSectionIndex = lines.findIndex((line) => line.startsWith("## "));
  const introLines = firstSectionIndex > -1 ? lines.slice(0, firstSectionIndex) : lines;
  const intro = introLines
    .filter((line) => {
      const trimmed = line.trim();
      return Boolean(trimmed && !trimmed.startsWith("# "));
    })
    .join(" ")
    .trim();

  const cards: LegalHubCard[] = [];
  let metadataTitle: string | undefined;
  let metadataDescription: string | undefined;

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];

    if (line.startsWith("### ")) {
      const cardTitle = line.replace("### ", "").replace(/^\d+\.\s*/, "").trim();
      const blockLines: string[] = [];
      let cursor = i + 1;

      while (cursor < lines.length && !lines[cursor].startsWith("### ") && !lines[cursor].startsWith("## ")) {
        blockLines.push(lines[cursor]);
        cursor += 1;
      }

      i = cursor - 1;
      const block = blockLines.join("\n");
      const icon = extractIcon(block);
      const route = extractRoute(block);
      const description = extractDescription(block);

      if (icon && route && description) {
        cards.push({
          title: cardTitle,
          icon,
          route,
          description,
        });
      }
      continue;
    }

    if (line.trim().startsWith("- **title:**")) {
      metadataTitle = line.replace("- **title:**", "").trim();
    }

    if (line.trim().startsWith("- **description:**")) {
      metadataDescription = line.replace("- **description:**", "").trim();
    }
  }

  return {
    title,
    intro,
    cards,
    metadataTitle,
    metadataDescription,
  };
}

function extractIcon(block: string): LegalHubCard["icon"] | null {
  const match = block.match(/-\s+\*\*[^*]*\*\*:\s*([A-Za-z]+)/);
  if (!match) {
    return null;
  }

  const value = match[1] as LegalHubCard["icon"];
  if (["Shield", "FileText", "Lock", "Cookie", "Users"].includes(value)) {
    return value;
  }

  return null;
}

function extractRoute(block: string): string | null {
  const match = block.match(/\/\[locale\]\/([a-z-]+)/);
  if (!match) {
    return null;
  }

  return `/${match[1]}`;
}

function extractDescription(block: string): string | null {
  const lines = block.split(/\r?\n/).map((line) => line.trim());
  const descriptionLine = lines.find((line) => /description|opis|опис/i.test(line));
  if (!descriptionLine) {
    return null;
  }

  return descriptionLine.replace(/^-\s+\*\*[^*]*\*\*:\s*/, "").trim();
}

/**
 * Chunking engine: splits extracted text into semantic sections (200-800 words).
 * Produces algorithmic depth levels as immediate fallback (no AI needed).
 */

export interface RawChunk {
  title: string;
  body: string;
  position: number;
}

export interface ChunkedSection {
  id: string;
  title: string;
  summary: string;
  condensed: string;
  standard: string;
  expanded: string;
}

const MIN_WORDS = 200;
const MAX_WORDS = 800;

/** Split text into semantic chunks based on headings and paragraph boundaries */
export function chunkText(text: string): RawChunk[] {
  const lines = text.split("\n");
  const rawSections: { title: string; lines: string[] }[] = [];
  let currentTitle = "";
  let currentLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (currentLines.length > 0) currentLines.push("");
      continue;
    }

    // Detect headings: markdown-style (#, ##, ###) or heuristic
    const headingMatch = trimmed.match(/^#{1,3}\s+(.+)/);
    if (headingMatch || isLikelyHeading(trimmed)) {
      // Save previous section if it has content
      const body = currentLines.join("\n").trim();
      if (body && wordCount(body) > 30) {
        rawSections.push({ title: currentTitle || autoTitle(body), lines: currentLines });
      }
      currentTitle = headingMatch ? headingMatch[1] : trimmed;
      currentLines = [];
    } else {
      currentLines.push(trimmed);
    }
  }

  // Don't forget the last section
  const body = currentLines.join("\n").trim();
  if (body && wordCount(body) > 30) {
    rawSections.push({ title: currentTitle || autoTitle(body), lines: currentLines });
  }

  // Now split large sections and merge small ones
  const chunks: RawChunk[] = [];
  let position = 0;

  for (const section of rawSections) {
    const sectionBody = section.lines.join("\n").trim();
    const wc = wordCount(sectionBody);

    if (wc > MAX_WORDS) {
      // Split on paragraph boundaries
      const paragraphs = sectionBody.split(/\n\s*\n/);
      let currentChunk = "";
      let chunkIndex = 0;

      for (const para of paragraphs) {
        if (wordCount(currentChunk + "\n\n" + para) > MAX_WORDS && wordCount(currentChunk) >= MIN_WORDS) {
          chunks.push({
            title: chunkIndex === 0 ? section.title : `${section.title} (cont.)`,
            body: currentChunk.trim(),
            position: position++,
          });
          currentChunk = para;
          chunkIndex++;
        } else {
          currentChunk = currentChunk ? currentChunk + "\n\n" + para : para;
        }
      }

      if (currentChunk.trim()) {
        // Merge tiny trailing chunk with previous
        if (wordCount(currentChunk) < MIN_WORDS / 2 && chunks.length > 0) {
          chunks[chunks.length - 1].body += "\n\n" + currentChunk.trim();
        } else {
          chunks.push({
            title: chunkIndex === 0 ? section.title : `${section.title} (cont.)`,
            body: currentChunk.trim(),
            position: position++,
          });
        }
      }
    } else if (wc < MIN_WORDS / 2 && chunks.length > 0) {
      // Merge tiny section with previous
      chunks[chunks.length - 1].body += "\n\n" + sectionBody;
    } else {
      chunks.push({
        title: section.title,
        body: sectionBody,
        position: position++,
      });
    }
  }

  return chunks;
}

/** Generate algorithmic depth levels (no AI, instant) */
export function generateAlgorithmicDepths(chunks: RawChunk[]): ChunkedSection[] {
  return chunks.map((chunk, i) => {
    const sentences = extractSentences(chunk.body);
    const paragraphs = chunk.body.split(/\n\s*\n/).filter(p => p.trim());

    return {
      id: `s${i + 1}`,
      title: chunk.title,
      summary: sentences[0] || chunk.body.slice(0, 100),
      condensed: paragraphs[0] || sentences.slice(0, 3).join(" "),
      standard: chunk.body,
      expanded: chunk.body, // no expansion without AI
    };
  });
}

function extractSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 10);
}

function wordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

function isLikelyHeading(line: string): boolean {
  const words = line.split(/\s+/);
  if (words.length > 10) return false;
  if (words.length < 2) return false;

  // ALL CAPS
  if (line === line.toUpperCase() && line !== line.toLowerCase()) return true;

  // Short line without terminal punctuation
  if (words.length <= 8) {
    const lastChar = line[line.length - 1];
    if (!['.', ',', ';', ':', '?', '!'].includes(lastChar)) {
      const lower = line.toLowerCase();
      if (/^(chapter|part|section|introduction|conclusion|epilogue|prologue|appendix)\b/.test(lower)) {
        return true;
      }
    }
  }

  return false;
}

function autoTitle(body: string): string {
  const firstSentence = body.split(/[.!?]/)[0]?.trim() || "";
  if (firstSentence.length <= 60) return firstSentence;
  return firstSentence.slice(0, 57) + "...";
}

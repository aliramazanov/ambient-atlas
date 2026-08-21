const MAX_LENGTH = 155;
const ELLIPSIS = "…";

export function summarize(text: string, max = MAX_LENGTH): string {
  const clean = text.replace(/\s+/g, " ").trim();
  const stop = clean.search(/[.!?](\s|$)/);
  const sentence = stop === -1 ? clean : clean.slice(0, stop + 1);
  if (sentence.length <= max) return sentence;

  const budget = max - ELLIPSIS.length;
  const boundary = clean.slice(0, budget + 1).lastIndexOf(" ");
  return clean.slice(0, boundary > 0 ? boundary : budget).trimEnd() + ELLIPSIS;
}

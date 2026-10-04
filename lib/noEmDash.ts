const CODE = /```[\s\S]*?(?:```|$)|`[^`\n]*`/g;
const PLACEHOLDER = /\u0000(\d+)\u0000/g;

export function stripEmDashes(text: string): string {
  if (!text.includes("—") && !text.includes("--")) return text;
  const code: string[] = [];
  const masked = text.replace(CODE, (m) => `\u0000${code.push(m) - 1}\u0000`);
  return masked
    .replace(/^([ \t]*)—[ \t]*/gm, "$1")
    .replace(/[ \t]*—[ \t]*(?=[.,;:!?)\]]|$)/gm, "")
    .replace(/[ \t]*—[ \t]*/g, ", ")
    .replace(/(?<=[^\s|])[ \t]+--[ \t]+(?=[^\s|-])/g, ", ")
    .replace(PLACEHOLDER, (_, i) => code[Number(i)]);
}

const MID_LINE_HEADING_RE = /([.!?)\]])[ \t]+(#{1,6} +\S)/g;
const FENCE_SPLIT_RE = /(^(?:```|~~~)[\s\S]*?(?:^(?:```|~~~)|$(?![\s\S])))/gm;

export function splitMidLineHeadings(markdown: string): string {
  return markdown
    .split(FENCE_SPLIT_RE)
    .map((part) =>
      /^(```|~~~)/.test(part) ? part : part.replace(MID_LINE_HEADING_RE, "$1\n\n$2"),
    )
    .join("");
}

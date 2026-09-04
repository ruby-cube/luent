import type { FromTag, Ion, RenderTag } from "luent";

export interface TourSection {
  heading: string;
  Description: RenderTag;
  Note?: RenderTag<FromTag<{ tab: CodeTab }>>
  url: string;
  tab: CodeTab & { toggle(): void },
  nsx?: string,
  tsx?: string,
  ns?: string,
  ts?: string,
  nsHover?: { [key: string]: string },
  tsHover?: { [key: string]: string },
}

export type CodeTab = Ion<"main" | "alt">

export type CodeBlock = {
  main: { name: string, code: string, lang?: string, hover?: { [key: string]: string }};
  alt: { name: string, code: string, lang?: string, hover?: { [key: string]: string }};
  highlight: (code: string, lang: string) => Promise<string>;
}
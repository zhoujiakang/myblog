export interface Heading {
  id: string;
  level: number;
  text: string;
}
export interface Post {
  slug: string;
  title: string;
  summary: string;
  date: string;
  group: string;
  tags: string[];
  body: string;
  html: string;
  toc: Heading[];
  words: number;
  minutes: number;
  draft?: boolean;
  revision?: string;
}
export interface PostInput {
  slug: string;
  title: string;
  summary: string;
  date: string;
  group: string;
  tags: string[];
  body: string;
  draft: boolean;
  revision?: string;
}

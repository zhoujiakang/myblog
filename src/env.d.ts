/// <reference types="vite/client" />
declare const __LOCAL_EDITOR__: boolean;
declare module 'virtual:blog-content' {
  const posts: import('./types/blog').Post[];
  export default posts;
}

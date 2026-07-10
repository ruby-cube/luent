// source main.tsx 
// 
// import { Counter } from “./Counter” 
// mountHyperHTML(“/index.html”, () => 
//   <html><body><Counter/></body></html>
// ) 

// transformed main.tsx 
// 
// import { Counter } from “./Counter” 
// mountIsland(() => <Counter/>, “#counter01”) 

// index.html 
// 
// <html>
//   <body>
//     <luent-island id=“counter01”><luent-island/>
//   </body>
// </html>

export function mountHyperHTML(path: string, render: () => JSX.Element) {
  // noop macro
}
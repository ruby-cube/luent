
//from Svelte: https://github.com/sveltejs/svelte/blob/main/packages/svelte/src/animate/index.js
export function flip(node: Element, { from, to }: { from: DOMRect, to: DOMRect }, params: {
   delay?: number;
   duration?: ((d: number) => number) | number
   easing?: (d: number) => number
} = {}) {
   var style = getComputedStyle(node);
   var zoom = getZoom(node); // https://drafts.csswg.org/css-viewport/#effective-zoom

   var transform = style.transform === 'none' ? '' : style.transform;
   var [ox, oy] = style.transformOrigin.split(' ').map(parseFloat);
   var dsx = from.width / to.width;
   var dsy = from.height / to.height;

   var dx = (from.left + dsx * ox - (to.left + ox)) / zoom;
   var dy = (from.top + dsy * oy - (to.top + oy)) / zoom;
   var { delay = 0, duration = (d) => Math.sqrt(d) * 120, easing = cubicOut } = params;

   return {
      delay,
      duration: typeof duration === 'function' ? duration(Math.sqrt(dx * dx + dy * dy)) : duration,
      easing,
      css: (t: number, u: number) => {
         var x = u * dx;
         var y = u * dy;
         var sx = t + u * dsx;
         var sy = t + u * dsy;
         return `transform: ${transform} scale(${sx}, ${sy}) translate(${x}px, ${y}px);`;
      }
   };
}


function getZoom(element: Element) {
   if ('currentCSSZoom' in element) {
      return element.currentCSSZoom as number;
   }

   var current: Element | null = element;
   var zoom = 1;

   while (current !== null) {
      zoom *= +getComputedStyle(current).zoom;
      current = current.parentElement;
   }

   return zoom;
}
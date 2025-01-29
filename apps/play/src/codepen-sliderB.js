const sliderHandle = document.querySelector(
   ".slider-handle"
 );
 const slider = document.querySelector(".slider");
 
 const [sectionA, sectionB] = document.querySelectorAll(".case");
 
 const [caseA, caseB] = document.querySelectorAll("span");
 
 // let first = 1;
 let left = 1;
 let right = 2;
 // let _left = left;
 // let _right = right;
 
 // case0.childNodes[0].data = `${calcPercentage(first, 3)}%`;
 caseA.childNodes[0].data = `${calcPercentage(left, left+right)}%`;
 caseB.childNodes[0].data = `${calcPercentage(right, left+right)}%`;
 
 function calcPercentage(fr, total) {
   return Math.floor((fr / total) * 100);
 }
 
 sliderHandle.addEventListener("mousedown", (e) => {
   const startX = e.clientX;
   // console.log("startX", startX);
   const widthA = sectionA.offsetWidth;
   const localWidth = widthA + sectionB.offsetWidth;
 
   console.log("localWidth.", localWidth);
 
   // let _startX = startX;
   // let newWidth = localWidth;
   // let newFirst = 1;
   let newLeft;
   let newRight;
   const total = left+right
   document.addEventListener("mousemove", reMouseMove);
   function reMouseMove(e) {
     // const deltaX = e.clientX - _startX;
 
     const deltaX = e.clientX - startX;
     // const overflow = widthA + _deltaX;
 
     [newLeft, newRight] = calcSliderDivisions(deltaX, localWidth, left, right);
     // console.log("overflow", overflow);
 
 
     // newFirst = overflow <= 0 ? newLeft : 1;
     // newLeft = overflow <= 0 ? 0 : newLeft;
 
     // case0.childNodes[0].data = `${calcPercentage(newFirst, 3)}% ${first}`;
     caseA.childNodes[0].data = `${calcPercentage(newLeft, newLeft+newRight)}%`;
     caseB.childNodes[0].data = `${calcPercentage(newRight, newLeft+newRight)}% ${deltaX}`;
 
 
     // console.log(newFirst + newRight);
 
     slider.style.setProperty(
       "--slider-divisions",
       `${newLeft}fr ${newRight}fr`
     );
     // newWidth = overflow <= 0 ? 500 : localWidth;
     // _left = overflow <= 0 ? first : left;
     // _right = overflow <= 0 ? left + right : right;
     // _startX = overflow <= 0 ? startX - widthA : startX;
   }
 
   document.addEventListener(
     "mouseup",
     (e) => {
       document.removeEventListener("mousemove", reMouseMove);
       // first = newFirst;
       left = newLeft;
       right = newRight;
     },
     { once: true }
   );
 });
 
 function calcSliderDivisions(deltaX, width, startLeft, startRight) {
   const total = startLeft+startRight
   const change = (deltaX / width) * total;
   return [startLeft + change, startRight - change];
 }

 css`
 .slider {
   width: 500px;
   background-color: beige;
   display: grid;
   text-align: center;
   grid-template-columns: var(--slider-divisions);
     overflow: hidden;
 }
 
 .case {
  position: relative; 
   user-select: none;
   box-sizing:border-box;
   min-width: 0;
   text-wrap: nowrap;
 }
 
 span {
 /*   overflow:hidden; */
 }
 
 
 .c {
   background-color: beige;
 }
 
 .a {
   background-color: pink;
 }
 
 .b {
   background-color: lightgreen
 }
 
 .slider-handle {
   position: absolute;
   width: 6px;
   height: 100%;
   background-color: gray;
   top: 0px;
   right: -3px;
   z-index: 10;
   cursor: pointer;
 }
 `

 html`
 <div class='slider' style='--slider-divisions: 1fr 2fr'>
<!--    <div class='case c'>
    <span>X%</span>
    <div class='slider-handle'></div>
  </div> -->
  <div class='case a'>
    <span>X%</span>
    <div class='slider-handle'></div>
  </div>
  <div class='case b'><span>X%</span></div>
</div>`
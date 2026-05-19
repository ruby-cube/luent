const sliderHandle = document.querySelector(".slider-handle");
const slider = document.querySelector(".slider");

const [caseA, caseB] = document.querySelectorAll("span");
let left = 1;
let right = 1;

caseA.childNodes[0].data = `${calcPercentage(left)}%`;
caseB.childNodes[0].data = `${calcPercentage(right)}%`;

function calcPercentage(fr) {
  return Math.floor((fr / 2) * 100);
}

sliderHandle.addEventListener("mousedown", (e) => {
  const startX = e.clientX;
  console.log("startXs?", startX);

  let newLeft;
  let newRight;
  document.addEventListener("mousemove", reMouseMove);
  function reMouseMove(e) {
    const deltaX = e.clientX - startX;
    [newLeft, newRight] = calcSliderDivisions(deltaX, 500, left, right);
    caseA.childNodes[0].data = `${calcPercentage(newLeft)}%`;
    caseB.childNodes[0].data = `${calcPercentage(newRight)}%`;
 
    slider.style.setProperty("--slider-divisions", `${newLeft}fr ${newRight}fr`);
  }

  document.addEventListener(
    "mouseup",
    (e) => {
      document.removeEventListener("mousemove", reMouseMove);
      left = newLeft;
      right = newRight;
    },
    { once: true }
  );
});



function calcSliderDivisions(deltaX, width, startLeft, startRight) {
  const change = (deltaX / width) * 2;
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
 }`

html`
<div class='slider' style='--slider-divisions: 1fr 1fr;'>
  <div class='case a'>
    <span>X%</span>
    <div class='slider-handle'></div>
  </div>
  <div class='case b'><span>X%</span></div>
</div>`
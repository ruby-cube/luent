//crossfade
export default {}
// const a = document.querySelector("#a")!;
// const b = document.querySelector("#b")!;
// const mover = document.querySelector("#mover")!;
// const final = document.createElement("div");
// const finalMover = document.createElement("div");
// final.setAttribute("id", "final");
// final.textContent = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor'
// finalMover.setAttribute("id", "final-mover");
// finalMover.appendChild(final)
// const btn = document.querySelector("button")!;

// btn.addEventListener("click", () => {
//    // READ initial
//    const initialPosition = mover.getBoundingClientRect();

//    // WRITE
//    b.appendChild(finalMover);

//    // READ initial of final
//    const finalPosition = finalMover.getBoundingClientRect();

//    // COMPUTE
//    const deltaX = finalPosition.left - initialPosition.left;
//    const deltaY = finalPosition.y - initialPosition.y;
//    const scaleXDelta = finalPosition.width / initialPosition.width;
//    const scaleYDelta = finalPosition.height / initialPosition.height;

//    // ANIMATE
//    var player = mover.animate([
//       {
//          transform: `translate(0, 0) scale(1, 1)`,
//          opacity: 1
//       },
//       {
//          transform: `translate(${deltaX}px, ${deltaY}px) scale(${scaleXDelta}, ${scaleYDelta})`,
//          opacity: 0
//       }
//    ], {
//       duration: 1800,
//       easing: "cubic-bezier(0,0,0.32,1)"
//    });

//    var player2 = finalMover.animate([
//       {
//          transform: `translate(${deltaX * -1}px, ${deltaY * -1}px) scale(${1 / scaleXDelta}, ${1 / scaleYDelta})`,
//          opacity: 0
//       },
//       {
//          transform: `translate(0, 0) scale(1,1)`,
//          opacity: 1
//       }
//    ], {
//       duration: 1800,
//       easing: "cubic-bezier(0,0,0.32,1)"
//    });

//    player.addEventListener("finish", () => {
//       mover.remove();
//    });
// });

//crossfade
const body = document.querySelector("body")!;
const a = document.querySelector("#a");
const b = document.querySelector("#b")!;
const mover = document.querySelector("#mover")! as HTMLElement;
const final = document.createElement("div");
const finalMover = document.createElement("div");
final.setAttribute("id", "final");
final.textContent = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor'
finalMover.setAttribute("id", "final-mover");
finalMover.appendChild(final)
const btn = document.querySelector("button")!;

btn.addEventListener("click", () => {
   // READ initial
   const initialPosition = mover.getBoundingClientRect();

   // WRITE final state
   body.appendChild(mover)
   mover.style.position = 'absolute'
   mover.style.top = '0px'
   mover.style.left = '0px'
   mover.style.width = initialPosition.width + 'px'
   mover.style.height = initialPosition.height + 'px'
   b.appendChild(finalMover);

   // READ final
   const finalPosition = finalMover.getBoundingClientRect();

   // COMPUTE
   const deltaX = initialPosition.left - finalPosition.left;
   const deltaY = initialPosition.y - finalPosition.y;
   const deltaScaleX = initialPosition.width / finalPosition.width;
   const deltaScaleY = initialPosition.height / finalPosition.height;

   // ANIMATE
   var player = mover.animate(
      [{
         transform: `translate(${initialPosition.x}px, ${initialPosition.y}px) scale(1, 1)`,
         opacity: 1
      }, {
         transform: `translate(${finalPosition.x}px, ${finalPosition.y}px) scale(${1 / deltaScaleX}, ${1 / deltaScaleY})`,
         opacity: 0
      }],
      {
         duration: 1800,
         easing: "cubic-bezier(0,0,0.32,1)"
      }
   );
   var player2 = finalMover.animate(
      [{
         transform: `translate(${deltaX}px, ${deltaY}px) scale(${deltaScaleX}, ${deltaScaleY})`,
         opacity: 0
      },
      {
         transform: `translate(0, 0) scale(1, 1)`,
         opacity: 1
      }],
      {
         duration: 1800,
         easing: "cubic-bezier(0,0,0.32,1)"
      }
   );

   player.addEventListener("finish", () => {
      mover.remove();
   });
});


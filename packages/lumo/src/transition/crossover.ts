//crossfade
export default {}
const a = document.querySelector("#a")!;
const b = document.querySelector("#b")!;
const mover = document.querySelector("#mover")!;
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

   // WRITE
   b.appendChild(finalMover);

   // READ initial of final
   const finalPosition = finalMover.getBoundingClientRect();

   // COMPUTE
   const deltaX = finalPosition.left - initialPosition.left;
   const deltaY = finalPosition.y - initialPosition.y;
   const scaleXDelta = finalPosition.width / initialPosition.width;
   const scaleYDelta = finalPosition.height / initialPosition.height;

   // ANIMATE
   var player = mover.animate([
      {
         transform: `translate(0, 0) scale(1, 1)`,
         opacity: 1
      },
      {
         transform: `translate(${deltaX}px, ${deltaY}px) scale(${scaleXDelta}, ${scaleYDelta})`,
         opacity: 0
      }
   ], {
      duration: 1800,
      easing: "cubic-bezier(0,0,0.32,1)"
   });

   var player2 = finalMover.animate([
      {
         transform: `translate(${deltaX * -1}px, ${deltaY * -1}px) scale(${1 / scaleXDelta}, ${1 / scaleYDelta})`,
         opacity: 0
      },
      {
         transform: `translate(0, 0) scale(1,1)`,
         opacity: 1
      }
   ], {
      duration: 1800,
      easing: "cubic-bezier(0,0,0.32,1)"
   });

   player.addEventListener("finish", () => {
      mover.remove();
   });
});


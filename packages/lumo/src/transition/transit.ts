//move

const a = document.querySelector('#a')!

const b = document.querySelector('#b')!

const mover = document.querySelector('#mover')!

const btn = document.querySelector('button')!;

btn.addEventListener('click', () => {
   // READ
   const initialState = mover.getBoundingClientRect()

   // WRITE
   b.appendChild(mover);

   // READ
   const finalState = mover.getBoundingClientRect()

   const deltaX = initialState.left - finalState.left;
   const deltaY = initialState.top - finalState.top;
   const scaleXDelta = initialState.width / finalState.width;
   const scaleYDelta = initialState.height / finalState.height;

   var player = mover.animate([
      { transform: `translate(${deltaX}px, ${deltaY}px) scale(${scaleXDelta}, ${scaleYDelta})` },
      { transform: 'translate(0, 0) scale(1, 1)'}
   ], {
      duration: 300,
      easing: 'cubic-bezier(0,0,0.32,1)',
   });
})


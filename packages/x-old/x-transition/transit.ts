//move: apply final state, then transform to initial state and animate back to final state

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

// simple move: apply final state, then transform to initial state and animate back to final state
// crossover - original: transform from initial state to final state, apply final state
// crossover - final: apply final state, then transform to initial state and animate back to final state
// simple remove: transform from initial state to final state, apply final state
// simple insert: apply final state, then transform from initial state and animate back to final state

/*
* - a
* - o
* - b
* - c
*/

/* initial state
* - a
* - b // opacity 1 - 0, then remove
* - c
*/

/* final state
* - a
* - o
* - c
*/
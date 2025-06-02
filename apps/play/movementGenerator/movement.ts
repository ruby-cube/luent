console.log("running movement generator")

const movements = [
   'undercurve-overcurve',
   'lunge switch',
   'side crab',
   'side monkey',
   'handstand one-leg',
   'handstand switcheroo',
   'jaguar',
   // 'forward roll',
   'backward shoulder roll',
   'role',
   'flying squirrel',
   // 'swivel',
   'body half',
   'ape step',
   'shin-slide',
   "around-the-world",
   "rotation",
   // "body roll",
   "fall backward"
]

function getRandomMovement() {
   const index = Math.random() * (movements.length - 1)
   console.log('index', index)
   console.log('index', Math.floor(index))
   return movements[Math.floor(index)]
}
// no repeats
let prev = ""

function getNextMovement() {
   const movement = getRandomMovement()
   console.log('prev', prev)
   console.log('movement', movement)
   if (movement === prev) 
      return getNextMovement();
   return movement;
}


let count = 0;
function reSpacebar(e) {
   if (e.code !== 'Space') return;
   
   if (count === 0) {
      div!.innerHTML = ""
   }
   else {
      const p = document.createElement('p')
      p.textContent = "-"
      div!.appendChild(p)
   }
   console.log('answer:', prev)
   div!.appendChild(document.createTextNode(prev = getNextMovement()))
   console.log('answer:', prev)
   count++;
   if (count === 3) {
      count = 0;
      prev = ""
   }
}

const div = document.querySelector('#movement')
document.addEventListener('keydown', reSpacebar)




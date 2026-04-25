// import ''
console.log("running movement generator")

// const movements = [
//    'undercurve-overcurve',
//    'lunge switch',
//    'side crab',
//    'side monkey',
//    'handstand one-leg',
//    'handstand switcheroo',
//    'jaguar',
//    // 'forward roll',
//    'backward shoulder roll',
//    'role',
//    'flying squirrel',
//    // 'swivel',
//    'body half',
//    'ape step',
//    'shin-slide',
//    "around-the-world",
//    "rotation",
//    // "body roll",
//    "fall backward"
// ]

const movements = [
  "across-the-back roll",
  "air bridge rotation",
  "arched body turn",
  "au",
  "back leg sweep",
  "backward shoulder roll",
  "barrel leap",
  "barrel roll",
  "bear walk",
  "BJJ shrimp",
  "bridge rotation",
  "cat cross-step",
  "cat turn",
  "cat walk",
  "coin",
  "crab walk",
  "crescent roll",
  "dragon's tail (trailing leg)",
  "elbow lever backward pivot with leg attitude",
  "elbow lever lunge switch",
  "fetal curl rotation",
  "floor windmill arms",
  "floor windmill under bridge",
  "flying rotation",
  "forward leg sweep",
  "forward pivot (body halves)",
  "forward pivot with folded high kick",
  "handstand kickup",
  "Head-leading turn (en dehors)",
  "helicopter legs",
  "Hip-leading turn (en dehors)",
  "inside crescent kick",
  "jaguar",
  "leg crawl swivel",
  "leg swings",
  "leg swirl",
  "leg-leading rotation",
  "lizard walk",
  "low coin",
  "lunge forward slide out",
  "macaco",
  "martelo de chao",
  "monkey sweep",
  "outside crescent kick",
  "outside crescent kick to rise from floor",
  "parkour roll",
  "pencil turn",
  "plow to bridge",
  "pocket knife",
  "prone side pull",
  "quadrupedal rotation",
  "reversao",
  "reverse jaguar",
  "rolê",
  "s dobrado",
  "scorpion walk",
  "seat roll",
  "shin slide",
  "shoulder stand cartwheel",
  "side crab",
  "side monkey",
  "side shoulder stand",
  "skating ape",
  "snake roll",
  "soft x-roll",
  "stepping ape",
  "supine leg swings",
  "switcheroo",
  "twisted x-roll",
  "windmill arms",
  "windmill shoulder stand",
  "wushu double body turn",
  "x-sweep up"
]


function getRandomMovement() {
   const index = Math.random() * (movements.length - 1)
   return movements[Math.floor(index)]
}

// no consecutive repeats
let prev = ""

function getNextMovement() {
   const movement = getRandomMovement()
   if (movement === prev) 
      return getNextMovement();
   return movement;
}


export let count = 0;

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




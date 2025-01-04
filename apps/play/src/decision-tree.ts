const tree = {
   a: {
      name: 'build another',
      branches: [{
         name: 'success',
         chance: 50,
         branches: [{
            name: 'anxious',
            chance: 50,
         },
         {
            name: 'content',
            chance: 50,

         }]
      },
      {
         name: 'broken',
         chance: 50,
         branches: [{

         }]
      }]
   },
   b: {
      name: 'wind down',
      branches: [

      ]
   }
}

function calcProbability(...args) {
   let result = 1;
   for (const percentage of args) {
      const decimal = percentage / 100
      result = result * decimal
   }
   return result * 100;
}

const aGood = [
   calcProbability(50, 50, 50),
]

const aBad = [
   calcProbability(50, 50, 100),
   calcProbability(50, 50, 50),
   calcProbability(50, 90, 10, 1),
   calcProbability(50, 10),
]

const aVeryBad = [
   calcProbability(50, 90, 90, 50),
   calcProbability(50, 90, 90, 50),
   calcProbability(50, 90, 10, 99),
]

function sumOf(array: number[]) {
   return array.reduce((prev = 0, current) => prev + current)
}

const aGoodProb = sumOf(aGood)
const aBadProb = sumOf(aBad)
const aVeryBadProb = sumOf(aVeryBad)
console.log(aGoodProb + aBadProb + aVeryBadProb)
console.log('a good', aGoodProb)
console.log('a bad', aBadProb)
console.log('a very bad', aVeryBadProb)


const bGood = [
   calcProbability(70,60),
   calcProbability(30,40, 40),
   calcProbability(30,60,aGoodProb),
]

const bBad = [
   calcProbability(70, 40),
   calcProbability(30, 40, 60),
   calcProbability(30, 40, 60, aBadProb),
]

const bVeryBad = [
   calcProbability(30,60,aVeryBadProb),
]


const bGoodProb = sumOf(bGood)
const bBadProb = sumOf(bBad)
const bVeryBadProb = sumOf(bVeryBad)
console.log(bGoodProb + bBadProb + bVeryBadProb)
console.log('a good', bGoodProb)
console.log('a bad', bBadProb)
console.log('a very bad',bVeryBadProb)
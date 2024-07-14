var indexMap = function(list) {
    var map = {}
    list.forEach(function(each, i) {
      map[each] = map[each] || []
      map[each].push(i)
    })
    return map
  }
  
  export var longestCommonSubstring = function(seq1: any[], seq2: any[]) {
    var result = {startString1:0, startString2:0, length:0}
    var indexMapBefore = indexMap(seq1)
    var previousOverlap: any[] = []
    seq2.forEach(function(eachAfter, indexAfter) {
      var overlapLength
      var overlap: any[] = []
      var indexesBefore = indexMapBefore[eachAfter] || []
      indexesBefore.forEach(function(indexBefore) {
        overlapLength = ((indexBefore && previousOverlap[indexBefore-1]) || 0) + 1;
        if (overlapLength > result.length) {
          result.length = overlapLength;
          result.startString1 = indexBefore - overlapLength + 1;
          result.startString2 = indexAfter - overlapLength + 1;
        }
        overlap[indexBefore] = overlapLength
      })
      previousOverlap = overlap
    })
    return getSubsequence(seq1, result.startString1, result.length)
  }

// export function longestCommonSubsequence(newSequence: string | any[], oldSequence: string | any[]) { //FIX: this function is broken
//     let lcsLength = 0;
//     let lcsStartIndices = [0, 0];
//     // const [newSequence, oldSequence] = newSequence.length > oldSequence.length ? [newSequence, oldSequence] : [oldSequence, newSequence];

//     let prevSeqLength = 1;

//     let i = 0;
//     while (i < newSequence.length) {
//         const itemA = newSequence[i];
//         let j = 0;
//         while (j < oldSequence.length) {
//             const itemB = oldSequence[j];
//             if (itemA === itemB) {
//                 const longestPossibleLength = Math.min(oldSequence.length - j, newSequence.length - i);
//                 if (longestPossibleLength <= lcsLength) {
//                     j++;
//                     continue;
//                 }

//                 let seqLength = 0;

//                 while (seqLength < longestPossibleLength) {
//                     const itemA = newSequence[i + seqLength];
//                     const itemB = oldSequence[j + seqLength];

//                     if (itemA == null || itemB == null || itemA !== itemB) {
//                         if (seqLength > lcsLength) {
//                             lcsLength = seqLength;
//                             lcsStartIndices = [i, j];
//                         }
//                         prevSeqLength = seqLength;
//                         break;
//                     };
//                     seqLength += 1;
//                 }

//             }
//             j++;
//         }
//         i += prevSeqLength;
//         prevSeqLength = 1;
//     }


//     const result = {
//         newSequence,
//         oldSequence,
//         length: lcsLength,
//         seq: getSubsequence(newSequence, lcsStartIndices[0], lcsLength),
//         lcsStartIndices
//     };
//     console.log(result)
//     return {
//         newSequence,
//         oldSequence,
//         length: lcsLength,
//         seq: getSubsequence(newSequence, lcsStartIndices[0], lcsLength),
//         lcsStartIndices
//     };
// };

//  a b c d e f g
//  ^
//  i
//
//  g a b c d f e
//    ^       ^
//    j       k = 4


//  a b c d e f g
//    ^
//    i
// 
//  g a b c d f e
//      ^       ^
//      j       k = 4


function getSubsequence(sequence: string | any[], startIndex: number, length: number) {
    const endIndex = startIndex + length;
    if (typeof sequence === "string")
        return sequence.substring(startIndex, endIndex)
    return sequence.slice(startIndex, endIndex)
}



const wordsA = [
    "blast",
    "exposure",
    "agree",
    "stitch",
    "characteristic",
    "strict",
    "paralyzed",
    "talk",
    "worry",
    "moon",
    "cycle",
    "old",
    "shift",
    "message",
    "reject",
    "overall",
    "settlement",
    "hold",
    "flat",
    "fling",
]

const wordsB = [
    "abtsl",
    "rpsexeuo",
    "aeegr",
    "scttih",
    "ectratrhiicsac",
    "citrst",
    "layrdeazp",
    "lkta",
    "owyrr",
    "onom",
    "lecyc",
    "dol",
    "thfsi",
    "emesgas",
    "jecert",
    "lorevla",
    "tmnlesetet",
    "dlho",
    "tfla",
    "nilgf",
]

let i = 0;
while (i < wordsB.length) {
    console.log(longestCommonSubstring(Array.from(wordsA[i]), Array.from(wordsB[i])))
    i++;
}

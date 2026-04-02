var indexMap = function(list: any[]) {
    var map: Map<any, number[]> = new Map()
    for (let i =0; i<list.length; i++){
      const item = list[i]
       map.set(item, map.get(item) || [])
       map.get(item)!.push(i)

    }
    return map
  }
  
  export var longestCommonSubstring = function(seq1: any[], seq2: any[]): {indexOf: (item: unknown)=>number} {
    var result = {startString1:0, startString2:0, length:0}
    var indexMapBefore = indexMap(seq1)
    var previousOverlap: any[] = []
    seq2.forEach(function(eachAfter, indexAfter) {
      var overlapLength
      var overlap: any[] = []
      var indexesBefore = indexMapBefore.get(eachAfter) || []
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
    return getSubsequence(seq1, result.startString1, result.length) as {indexOf: (item: unknown)=>number}
  }


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



// const wordsA = [
//     "blast",
//     "exposure",
//     "agree",
//     "stitch",
//     "characteristic",
//     "strict",
//     "paralyzed",
//     "talk",
//     "worry",
//     "moon",
//     "cycle",
//     "old",
//     "shift",
//     "message",
//     "reject",
//     "overall",
//     "settlement",
//     "hold",
//     "flat",
//     "fling",
// ]

// const wordsB = [
//     "abtsl",
//     "rpsexeuo",
//     "aeegr",
//     "scttih",
//     "ectratrhiicsac",
//     "citrst",
//     "layrdeazp",
//     "lkta",
//     "owyrr",
//     "onom",
//     "lecyc",
//     "dol",
//     "thfsi",
//     "emesgas",
//     "jecert",
//     "lorevla",
//     "tmnlesetet",
//     "dlho",
//     "tfla",
//     "nilgf",
// ]

// let i = 0;
// while (i < wordsB.length) {
//     console.log(longestCommonSubstring(Array.from(wordsA[i]), Array.from(wordsB[i])))
//     i++;
// }

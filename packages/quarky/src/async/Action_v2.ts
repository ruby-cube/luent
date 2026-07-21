// no mutations in dispatch, only post to database
// last write wins

// const toggleLike = Action((post: Post) => {
//   post.like = !post.like
//   dispatch(() => awaiting(db.toggleLike(post.id))  
// }, { race: prev => 'override' })

// // under the hood, unfetch and refetch

// const toggleLike = Action((post: Post) => {
//   dispatch(() => awaiting(db.toggleLike(post.id))  
//     .then(() => post.refetch('like'))
// }, { race: prev => 'override' })


export function Action<F extends (...args: any[]) => void>(action: F) : (...args: Parameters<F>)=> Promise<>{

}
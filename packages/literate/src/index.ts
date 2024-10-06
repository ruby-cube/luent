export function fromEntries<T>(list: T[], render: (item: T) => string) {
    let result = ''
    for (const item of list) {
        result += render(item)
    }
    return result;
}

// export function html(...args: any[]) {
//     return () => {
//         const strings = args[0]
//         let result = ''
//         for (let i = 0; i < strings.length; i++) {
//             const expression = args[i + 1]
//             if (expression != null) {
//                 result += strings[i] + expression
//             }
//             else {
//                 result += strings[i]
//             }
//         }
//         return result;
//     }
// }

export * from './Suspense'
export * from './Literate'
export * from './PendingComponentMap'
export * from './ResponseTimer'
export * from './SSRComponent'
export * from './generateHTML'
export * from './makeComponent'
export * from './memoize'
// import { defineConfig } from 'vite'
// import luent from '../plugins/vite-plugin-luent/src/index.js'


// export default defineConfig(async () => {
//   const { default: tailwindcss } = await import('@tailwindcss/vite')

//   return {
//     oxc: {
//       charset: 'utf8',
//       jsx: {
//         throwIfNamespace: false,
//       },
//     },
//     server: {
//       fs: {
//         cachedChecks: false
//       }
//     },
//     plugins: [
//       tailwindcss(),
//       luent({ useWorkspace: true }),
//     ]
//   }
// })
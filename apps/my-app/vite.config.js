import { defineConfig } from 'vite'
import luent from 'vite-plugin-luent'


export default defineConfig(async () => {

  return {
    oxc: {
      charset: 'utf8',
    },
    server: {
      fs: {
        cachedChecks: false
      }
    },
    plugins: [
      luent(),
    ]
  }
})
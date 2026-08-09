import { defineConfig } from 'vite'
import luent from '../../plugins/vite-plugin-luent/index.js'

export default defineConfig({
   server: {
      fs: {
         cachedChecks: false
      }
   },
   plugins: [
      luent({ useWorkspace: true })
   ]
})
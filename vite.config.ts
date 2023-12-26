import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    __DEV__: false,
    __TEST__: false,
    __BROWSER__: true,
    __USE_DEVTOOLS__: false,
  },
  plugins: [vue()],
})

import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rolldownOptions: {
      input: {
        main: 'index.html',
        flows: 'flows.html',
      },
    },
  },
  server: {
    proxy: {
      '/graphql': 'http://localhost:4000',
    },
  },
})

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // O chunk da aba Documentos carrega o @react-pdf/renderer (lib pesada),
    // mas é code-split e só baixa sob demanda — então o tamanho é intencional.
    chunkSizeWarningLimit: 1500,
  },
})

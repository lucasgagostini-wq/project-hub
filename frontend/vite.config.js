import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// manualChunks separa as libs grandes em chunks próprios:
//  - 'charts' (recharts + d3) só é baixado quando ProjetoDetalhe (lazy) abre — tira o
//    maior peso (~300KB+) do carregamento inicial;
//  - 'icons', 'supabase' e 'react-vendor' mudam pouco entre deploys, então ganham cache
//    de longo prazo (não invalidam quando só o código do app muda).
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (id.includes('recharts') || id.includes('d3-') || id.includes('internmap') || id.includes('victory-vendor')) return 'charts';
          if (id.includes('@tabler')) return 'icons';
          if (id.includes('@supabase')) return 'supabase';
          if (id.includes('react-dom') || id.includes('/scheduler/') || id.includes('react/jsx-runtime')) return 'react-vendor';
        },
      },
    },
  },
});

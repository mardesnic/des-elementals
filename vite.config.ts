import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig({
  base: '/des-elementals/',
  plugins: [
    react(),
    // Installable from the browser menu, and works offline once loaded.
    VitePWA({
      registerType: 'autoUpdate',
      pwaAssets: { config: true },
      manifest: {
        // A fixed id of its own, so a phone never mixes it up with an earlier
        // install or with the other games on this site.
        id: 'des-elementals',
        name: 'Elements',
        short_name: 'Elements',
        description: 'A puzzle for kids: help the elements find each other',
        theme_color: '#6741d9',
        background_color: '#f4f5f7',
        display: 'standalone',
      },
    }),
  ],
});

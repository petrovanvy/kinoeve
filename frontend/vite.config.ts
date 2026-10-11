import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
export default defineConfig({ plugins: [svelte()], server: { port: 5173, strictPort: true, proxy: { '/api': { target: process.env.API_PROXY_TARGET || 'http://127.0.0.1:8000', changeOrigin: true } } } });

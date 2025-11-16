import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";



export default defineConfig({
  plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
  server: {
    host: true,
    allowedHosts:  [
      'hemispheroidal-collins-laudably.ngrok-free.dev',  // Your current ngrok domain
      '.ngrok.io',  // All ngrok subdomains
      '.ngrok-free.app',  // All ngrok-free subdomains
      'localhost',
      '127.0.0.1'
    ]
  }
});

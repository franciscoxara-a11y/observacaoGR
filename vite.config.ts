import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// `base: "./"` — o build usa caminhos relativos, para que a pasta `dist/`
// funcione servida de qualquer subdiretório (ou até aberta num servidor
// estático simples no tablet), sem depender de estar na raiz do domínio.
export default defineConfig({
  base: "./",
  plugins: [react(), tailwindcss()],
});

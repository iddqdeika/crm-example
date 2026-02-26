import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
export default defineConfig({
    plugins: [react()],
    server: { port: 3000, proxy: {
            "/auth": "http://localhost:8000",
            "/me": "http://localhost:8000",
            "/admin": "http://localhost:8000",
            "/health": "http://localhost:8000",
        } },
    test: {
        globals: true,
        environment: "jsdom",
        setupFiles: ["src/test/setup.ts"],
    },
});

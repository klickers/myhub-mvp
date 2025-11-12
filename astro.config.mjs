// @ts-check
import { defineConfig } from "astro/config"
import tailwindcss from "@tailwindcss/vite"
import react from "@astrojs/react"
import icon from "astro-icon"
import node from "@astrojs/node"

// https://astro.build/config
export default defineConfig({
	vite: {
		plugins: [tailwindcss()],
	},
	integrations: [react(), icon()],
	adapter: node({
		mode: "standalone",
	}),
	// output: "server",
})

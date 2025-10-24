// @ts-check
import { defineConfig } from "astro/config"
import tailwindcss from "@tailwindcss/vite"
import react from "@astrojs/react"
import db from "@astrojs/db"
import icon from "astro-icon"

// https://astro.build/config
export default defineConfig({
	vite: {
		plugins: [tailwindcss()],
	},
	integrations: [react(), db(), icon()],
})

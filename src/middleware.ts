import { defineMiddleware } from "astro:middleware"

export const onRequest = defineMiddleware((context, next) => {
	const password = import.meta.env.APP_PASSWORD
	const cookie = context.cookies.get("auth")?.value
	if (new URL(context.request.url).pathname !== "/login") {
		if (cookie === password) return next()
		else return context.redirect("/login", 302)
	} else return next()
})

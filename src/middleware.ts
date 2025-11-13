import { defineMiddleware } from "astro:middleware"
import crypto from "crypto"

const APP_PASSWORD = import.meta.env.APP_PASSWORD
const APP_SECRET = import.meta.env.APP_SECRET
const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 90 // 90 days

function verifyToken(token: string) {
	try {
		const [b64Ts, hmac] = token.split(".")
		if (!b64Ts || !hmac) return false
		const ts = Number(Buffer.from(b64Ts, "base64url").toString("utf8"))
		if (!Number.isFinite(ts)) return false

		const age = Math.floor(Date.now() / 1000) - ts
		if (age < 0 || age > TOKEN_TTL_SECONDS) return false // expired

		const payload = `${ts}:${APP_PASSWORD}`
		const expected = crypto
			.createHmac("sha256", APP_SECRET)
			.update(payload)
			.digest("base64url")
		return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(expected))
	} catch {
		return false
	}
}

export const onRequest = defineMiddleware((context, next) => {
	const url = new URL(context.request.url)
	const cookie = context.cookies.get("auth")?.value

	if (url.pathname === "/login") return next()
	if (cookie && verifyToken(cookie)) return next()
	return context.redirect("/login", 302)
})

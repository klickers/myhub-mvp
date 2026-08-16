const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/

export function getUtcDateKey(date: Date | string) {
	if (typeof date === "string" && DATE_KEY_PATTERN.test(date)) return date

	const value = date instanceof Date ? date : new Date(date)
	if (Number.isNaN(value.getTime())) return ""

	const year = value.getUTCFullYear()
	const month = String(value.getUTCMonth() + 1).padStart(2, "0")
	const day = String(value.getUTCDate()).padStart(2, "0")

	return `${year}-${month}-${day}`
}

export function dateKeyToUtcDate(dateKey: string) {
	return new Date(`${dateKey}T00:00:00.000Z`)
}

export function formatUtcDateOnly(
	date: Date | string,
	options: Intl.DateTimeFormatOptions = {
		month: "short",
		day: "2-digit",
		year: "numeric",
	},
) {
	return new Intl.DateTimeFormat("en-US", {
		timeZone: "UTC",
		...options,
	}).format(date instanceof Date ? date : new Date(date))
}

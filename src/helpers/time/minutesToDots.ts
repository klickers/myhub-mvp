export const minutesToDots = (minutes: number): string => {
	if (minutes < 0) return "00:00"

	const hours = Math.floor(minutes / 60)
	const mins = minutes % 60
	return `${hours < 10 ? "0" + hours : hours}:${String(mins).padStart(
		2,
		"0"
	)}`
}

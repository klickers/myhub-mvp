export const minutesToDots = (minutes: number): string => {
	const hours = Math.floor(minutes / 60)
	const mins = minutes % 60
	return `${hours < 10 ? "0" + hours : hours}:${String(mins).padStart(
		2,
		"0"
	)}`
}

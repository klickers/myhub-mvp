export const secondsToDots = (seconds: number): string => {
	const hours = Math.floor(seconds / 3600)
	const mins = Math.floor((seconds % 3600) / 60)
	const secs = seconds % 60

	return `${String(hours).padStart(2, "0")}:${String(mins).padStart(
		2,
		"0"
	)}:${String(secs).padStart(2, "0")}`
}

export default function minutesToHours(minutes: number): number {
	return Math.round((minutes / 60) * 100) / 100
}

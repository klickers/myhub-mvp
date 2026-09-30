export default function debounce<T extends (...args: any[]) => any>(
	func: T,
	wait: number,
): (...args: Parameters<T>) => void {
	let timeoutId: ReturnType<typeof setTimeout> | undefined

	return function (this: ThisParameterType<T>, ...args: Parameters<T>): void {
		const context = this
		if (timeoutId) clearTimeout(timeoutId)
		timeoutId = setTimeout(() => {
			func.apply(context, args)
		}, wait)
	}
}

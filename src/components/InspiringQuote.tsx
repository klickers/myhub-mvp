import { RotateCw } from "lucide-react"
import { useCallback, useEffect, useState } from "react"

const QUOTE_API_URL = "https://dummyjson.com/quotes/random"

type Quote = {
	author: string
	text: string
}

type QuoteApiResponse = {
	author?: unknown
	quote: string
}

function isQuoteApiResponse(value: unknown): value is QuoteApiResponse {
	return (
		typeof value === "object" &&
		value !== null &&
		"quote" in value &&
		typeof value.quote === "string"
	)
}

export default function InspiringQuote() {
	const [quote, setQuote] = useState<Quote | null>(null)
	const [status, setStatus] = useState("Loading")
	const [isLoading, setIsLoading] = useState(false)
	const [hasError, setHasError] = useState(false)

	const fetchQuote = useCallback(
		async ({
			loadingLabel = "Refreshing",
			signal,
		}: {
			loadingLabel?: string
			signal?: AbortSignal
		} = {}) => {
			setIsLoading(true)
			setStatus(loadingLabel)
			setHasError(false)

			try {
				const response = await fetch(QUOTE_API_URL, {
					cache: "no-store",
					signal,
				})

				if (!response.ok) {
					throw new Error(
						`Quote API responded with ${response.status}`
					)
				}

				const data: unknown = await response.json()

				if (!isQuoteApiResponse(data)) {
					throw new Error("Quote API returned an unexpected response")
				}

				setQuote({
					author:
						typeof data.author === "string" &&
						data.author.length > 0
							? data.author
							: "Unknown",
					text: data.quote,
				})
				setStatus("Fresh quote")
			} catch (error) {
				if (signal?.aborted) {
					return
				}

				console.error("Unable to fetch inspiring quote", error)
				setStatus("Offline")
				setHasError(true)
			} finally {
				if (!signal?.aborted) {
					setIsLoading(false)
				}
			}
		},
		[]
	)

	useEffect(() => {
		const controller = new AbortController()

		void fetchQuote({
			loadingLabel: "Loading",
			signal: controller.signal,
		})

		return () => controller.abort()
	}, [fetchQuote])

	return (
		<div className="card border-amber-200 bg-amber-50/70">
			<div className="card__content space-y-4">
				<div className="flex items-start justify-between gap-3">
					<div>
						<p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
							Inspiring Quote
						</p>
						<p className="mt-1 text-[11px] text-gray-500">
							{status}
						</p>
					</div>
					<button
						type="button"
						className="grid h-9 w-9 flex-none place-items-center rounded-full border border-amber-300 bg-white text-amber-700 shadow-sm duration-200 hover:border-amber-500 hover:text-amber-900 disabled:cursor-not-allowed disabled:opacity-60"
						aria-busy={isLoading}
						aria-label="Refresh quote"
						disabled={isLoading}
						onClick={() => void fetchQuote()}
						title="Refresh quote"
					>
						<RotateCw
							aria-hidden="true"
							className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
						/>
					</button>
				</div>
				<figure className="space-y-3">
					<blockquote>
						<p className="text-lg font-semibold leading-snug text-gray-950">
							{quote ? `"${quote.text}"` : "Finding a spark..."}
						</p>
					</blockquote>
					<figcaption className="text-sm text-gray-600">
						{quote ? `- ${quote.author}` : "One moment"}
					</figcaption>
				</figure>
				{hasError && (
					<p className="text-xs leading-relaxed text-red-700">
						Could not fetch a new quote. Try again in a moment.
					</p>
				)}
			</div>
		</div>
	)
}

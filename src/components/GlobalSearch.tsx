import { actions } from "astro:actions"
import { ArrowUpRight, Loader2, Search, X } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import type { KeyboardEvent } from "react"
import SideTray from "@/components/SideTray"
import { useDebounce } from "@/hooks/use-debounce"
import { cn } from "@/lib/utils"
import type { Task } from "@/generated/prisma/client"
import type { GlobalSearchResult } from "@/actions/search"

const MIN_QUERY_LENGTH = 1

function formatStatus(status: GlobalSearchResult["status"]) {
	const labels: Record<GlobalSearchResult["status"], string> = {
		active: "active",
		notstarted: "not started",
		inprogress: "in progress",
		onhold: "on hold",
		completed: "completed",
		archived: "archived",
	}

	return labels[status]
}

function getStatusClass(status: GlobalSearchResult["status"]) {
	if (status === "completed") {
		return "border-emerald-200 bg-emerald-50 text-emerald-700"
	}
	if (status === "archived") {
		return "border-gray-200 bg-gray-100 text-gray-500"
	}
	if (status === "onhold") {
		return "border-amber-200 bg-amber-50 text-amber-700"
	}
	if (status === "inprogress") {
		return "border-sky-200 bg-sky-50 text-sky-700"
	}
	if (status === "active") {
		return "border-violet-200 bg-violet-50 text-violet-700"
	}

	return "border-gray-200 bg-white text-gray-600"
}

function getTypeLabel(type: GlobalSearchResult["type"]) {
	return type
}

export default function GlobalSearch() {
	const [query, setQuery] = useState("")
	const debouncedQuery = useDebounce(query, 180)
	const [results, setResults] = useState<GlobalSearchResult[]>([])
	const [isOpen, setIsOpen] = useState(false)
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [activeIndex, setActiveIndex] = useState(0)
	const [selectedTask, setSelectedTask] = useState<Task | null>(null)
	const wrapperRef = useRef<HTMLDivElement | null>(null)
	const requestIdRef = useRef(0)

	const trimmedQuery = debouncedQuery.trim()
	const hasSearchableQuery = trimmedQuery.length >= MIN_QUERY_LENGTH

	useEffect(() => {
		const handlePointerDown = (event: PointerEvent) => {
			if (!wrapperRef.current?.contains(event.target as Node)) {
				setIsOpen(false)
			}
		}

		document.addEventListener("pointerdown", handlePointerDown)
		return () =>
			document.removeEventListener("pointerdown", handlePointerDown)
	}, [])

	useEffect(() => {
		if (!hasSearchableQuery) {
			requestIdRef.current += 1
			setResults([])
			setError(null)
			setIsLoading(false)
			setActiveIndex(0)
			return
		}

		const requestId = requestIdRef.current + 1
		requestIdRef.current = requestId
		setIsLoading(true)
		setError(null)
		setIsOpen(true)

		actions.search
			.global({ query: trimmedQuery })
			.then((response) => {
				if (requestIdRef.current !== requestId) return
				if (response.error) {
					console.error("Failed to search", response.error)
					setResults([])
					setError("Search failed")
					return
				}
				setResults(response.data ?? [])
				setActiveIndex(0)
			})
			.catch((cause) => {
				if (requestIdRef.current !== requestId) return
				console.error("Failed to search", cause)
				setResults([])
				setError("Search failed")
			})
			.finally(() => {
				if (requestIdRef.current === requestId) setIsLoading(false)
			})
	}, [hasSearchableQuery, trimmedQuery])

	const clearSearch = () => {
		setQuery("")
		setResults([])
		setIsOpen(false)
		setError(null)
		setActiveIndex(0)
	}

	const selectResult = (result: GlobalSearchResult) => {
		if (result.type === "task") {
			setSelectedTask(result.task)
			setIsOpen(false)
			return
		}

		window.location.href = result.href
	}

	const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
		if (event.key === "Escape") {
			event.preventDefault()
			setIsOpen(false)
			return
		}

		if (!isOpen || results.length === 0) return

		if (event.key === "ArrowDown") {
			event.preventDefault()
			setActiveIndex((current) => (current + 1) % results.length)
			return
		}

		if (event.key === "ArrowUp") {
			event.preventDefault()
			setActiveIndex(
				(current) => (current - 1 + results.length) % results.length,
			)
			return
		}

		if (event.key === "Enter") {
			event.preventDefault()
			const result = results[activeIndex]
			if (result) selectResult(result)
		}
	}

	const showPanel = isOpen && hasSearchableQuery

	return (
		<>
			<div
				ref={wrapperRef}
				className="global-search fixed right-7 top-[1.125rem] z-40 w-[min(22rem,36vw)] min-w-[12rem]"
			>
				<label
					htmlFor="global-search"
					className="sr-only"
				>
					Search guilds, contracts, experiments, categories, and tasks
				</label>
				<div className="flex h-8 items-center gap-2 rounded-lg border border-gray-300/80 bg-white/70 px-2.5 text-gray-700 shadow-sm transition-[background-color,border-color,box-shadow] duration-150 focus-within:border-gray-500 focus-within:bg-white">
					<Search
						className="size-3.5 flex-none text-gray-400"
						aria-hidden="true"
					/>
					<input
						id="global-search"
						type="search"
						value={query}
						onChange={(event) => {
							setQuery(event.target.value)
							if (event.target.value.trim()) setIsOpen(true)
						}}
						onFocus={() => {
							if (query.trim()) setIsOpen(true)
						}}
						onKeyDown={handleKeyDown}
						placeholder="Search..."
						autoComplete="off"
						className="min-w-0 flex-1 bg-transparent text-sm text-gray-950 outline-none placeholder:text-gray-400"
						role="combobox"
						aria-autocomplete="list"
						aria-controls="global-search-results"
						aria-expanded={showPanel}
					/>
					{isLoading ? (
						<Loader2
							className="size-3.5 flex-none animate-spin text-gray-400"
							aria-label="Searching"
						/>
					) : query ? (
						<button
							type="button"
							onClick={clearSearch}
							className="inline-flex size-5 flex-none items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 focus-visible:outline-none"
							aria-label="Clear search"
						>
							<X
								className="size-3.5"
								aria-hidden="true"
							/>
						</button>
					) : null}
				</div>

				{showPanel && (
					<div
						id="global-search-results"
						role="listbox"
						className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-[min(28rem,calc(100vw-2rem))] overflow-hidden rounded-lg border border-gray-300/75 bg-white/95 shadow-2xl shadow-slate-900/15 backdrop-blur-xl"
					>
						{error ? (
							<p className="px-3 py-4 text-sm text-rose-700">
								{error}
							</p>
						) : results.length > 0 ? (
							<ul className="max-h-[22rem] overflow-y-auto p-1.5">
								{results.map((result, index) => {
									const isSelected = index === activeIndex
									const content = (
										<>
											<div className="min-w-0 flex-1">
												<p className="truncate text-sm font-semibold text-gray-950">
													{result.title}
												</p>
												<div className="mt-1 flex min-w-0 flex-wrap items-center gap-1.5">
													<span className="rounded-md border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-[0.68rem] font-semibold uppercase text-gray-500">
														{getTypeLabel(
															result.type,
														)}
													</span>
													<span
														className={cn(
															"rounded-md border px-1.5 py-0.5 text-[0.68rem] font-semibold",
															getStatusClass(
																result.status,
															),
														)}
													>
														{formatStatus(
															result.status,
														)}
													</span>
												</div>
											</div>
											{result.type !== "task" && (
												<ArrowUpRight
													className="size-3.5 flex-none text-gray-400"
													aria-hidden="true"
												/>
											)}
										</>
									)

									return (
										<li
											key={`${result.type}-${result.id}`}
											role="option"
											aria-selected={isSelected}
										>
											{result.type === "task" ? (
												<button
													type="button"
													onClick={() =>
														selectResult(result)
													}
													onMouseEnter={() =>
														setActiveIndex(index)
													}
													className={cn(
														"flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors focus-visible:outline-none",
														isSelected
															? "bg-gray-100"
															: "hover:bg-gray-50",
													)}
												>
													{content}
												</button>
											) : (
												<a
													href={result.href}
													onClick={() =>
														setIsOpen(false)
													}
													onMouseEnter={() =>
														setActiveIndex(index)
													}
													className={cn(
														"flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors focus-visible:outline-none",
														isSelected
															? "bg-gray-100"
															: "hover:bg-gray-50",
													)}
												>
													{content}
												</a>
											)}
										</li>
									)
								})}
							</ul>
						) : isLoading ? (
							<p className="px-3 py-4 text-sm text-gray-500">
								Searching...
							</p>
						) : (
							<p className="px-3 py-4 text-sm text-gray-500">
								No results found.
							</p>
						)}
					</div>
				)}
			</div>

			{selectedTask && (
				<div className="fixed inset-0 z-[100]">
					<SideTray
						type="task"
						selected={selectedTask}
						setSelected={setSelectedTask}
					/>
				</div>
			)}
		</>
	)
}

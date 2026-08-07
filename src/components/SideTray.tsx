import type { Status, Task } from "@/generated/prisma/client"
import EditableText from "./form/EditableText"
import { actions } from "astro:actions"
import SessionPlayButton from "./models/session/SessionPlayButton"
import EditableNumber from "./form/EditableNumber"
import EditableMakeTimeType from "./form/EditableMakeTimeType"
import EditableStatus from "./form/EditableStatus"
import EditableDate from "./form/EditableDate"
import Subtasks from "./models/task/Subtasks"
import {
	TASK_REMOVED_EVENT,
	dispatchTaskUpdated,
	type TaskRemovedEvent,
} from "@/helpers/taskEvents"
import { ChevronRight, X } from "lucide-react"
import {
	useEffect,
	useMemo,
	useState,
	type Dispatch,
	type SetStateAction,
} from "react"
import TaskDeleteButton from "@/components/models/task/TaskDeleteButton"

type Props = {
	type: "task"
	selected: Task
	selectedId?: never
	setSelected: Dispatch<SetStateAction<any>>
	onTaskChange?: (task: Task) => void
}
// | {
// 		type: "task"
// 		selected?: never
// 		selectedId: number
// 		setSelected: (id: number) => void
//   }

type TaskBreadcrumbItem = {
	type: "area" | "guild" | "contract" | "experiment" | "task" | "task-root"
	id: number | null
	name: string
	href: string | null
}

export default function SideTray({
	type,
	selected,
	// selectedId,
	setSelected,
	onTaskChange,
}: Props) {
	const [breadcrumbs, setBreadcrumbs] = useState<TaskBreadcrumbItem[]>([])
	const [breadcrumbsLoading, setBreadcrumbsLoading] = useState(false)
	const closeTray = () => setSelected(null)

	// useEffect(() => {
	// 	if (selectedId && !selected) {
	// 		// fetch the task by id and set it as selected
	// 		actions.task.getById({ id: selectedId }).then((task) => {
	// 			if (task) setSelected(task)
	// 		})
	// 	}
	// }, [selectedId])

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") setSelected(null)
		}

		document.addEventListener("keydown", handleKeyDown)
		return () => document.removeEventListener("keydown", handleKeyDown)
	}, [setSelected])

	useEffect(() => {
		const handleTaskRemoved = (event: Event) => {
			const { taskIds } = (event as TaskRemovedEvent).detail
			if (taskIds.includes(selected.id)) setSelected(null)
		}

		window.addEventListener(TASK_REMOVED_EVENT, handleTaskRemoved)
		return () =>
			window.removeEventListener(TASK_REMOVED_EVENT, handleTaskRemoved)
	}, [selected.id, setSelected])

	useEffect(() => {
		let cancelled = false

		setBreadcrumbs([])
		setBreadcrumbsLoading(true)

		actions.task
			.breadcrumbs({ taskId: selected.id })
			.then((res) => {
				if (cancelled) return
				setBreadcrumbs(res.data?.breadcrumbs ?? [])
			})
			.catch((error) => {
				if (cancelled) return
				console.error("Failed to load task breadcrumbs", error)
				setBreadcrumbs([])
			})
			.finally(() => {
				if (!cancelled) setBreadcrumbsLoading(false)
			})

		return () => {
			cancelled = true
		}
	}, [selected.id])

	const visibleBreadcrumbs = useMemo(
		() =>
			breadcrumbs.map((breadcrumb) =>
				breadcrumb.type === "task" && breadcrumb.id === selected.id
					? { ...breadcrumb, name: selected.name }
					: breadcrumb,
			),
		[breadcrumbs, selected.id, selected.name],
	)

	const openTaskBreadcrumb = async (taskId: number) => {
		const res = await actions.task.getById({ id: taskId })
		if (res.data) setSelected(res.data)
	}

	const applySavedTaskChange = (patch: Partial<Task>) => {
		const updatedTask = { ...selected, ...patch }
		setSelected(updatedTask)
		onTaskChange?.(updatedTask)
		dispatchTaskUpdated(updatedTask)
	}

	const deadlineValue = selected.deadline
		? new Date(selected.deadline).toISOString()
		: null

	return (
		<>
			{/* BACKDROP */}
			<div
				className="fixed inset-0 z-40 bg-slate-900/10 backdrop-blur-[2px]"
				onClick={closeTray}
				aria-hidden="true"
			/>

			{/* TRAY */}
			<aside
				role="dialog"
				aria-modal="true"
				aria-labelledby="side-tray-title"
				className="side-tray fixed bottom-3 right-3 top-3 z-50 flex w-[min(38rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-lg border border-gray-300/70 bg-white/70 shadow-2xl shadow-slate-900/15 backdrop-blur-2xl backdrop-saturate-150 sm:bottom-4 sm:right-4 sm:top-4 sm:w-[min(40rem,calc(100vw-2rem))]"
				onClick={(e) => e.stopPropagation()}
			>
				<header className="flex items-start justify-between gap-4 border-b border-gray-300/60 bg-white/45 px-5 py-4">
					<div className="min-w-0 flex-1">
						<p
							id="side-tray-title"
							className="sr-only"
						>
							Task details for {selected.name}
						</p>
						<TaskBreadcrumbs
							breadcrumbs={visibleBreadcrumbs}
							isLoading={breadcrumbsLoading}
							onTaskSelect={openTaskBreadcrumb}
							selectedTaskId={selected.id}
						/>
						<div className="flex min-w-0 items-center gap-2">
							<EditableText
								value={selected.name}
								onSave={async (name) => {
									await actions.task.update({
										id: selected.id,
										name,
									})
									applySavedTaskChange({ name })
								}}
								className="min-h-9 min-w-0 flex-1 rounded-md px-1 py-0.5 text-left text-xl font-semibold leading-tight text-gray-950 transition-colors hover:bg-white/55 hover:no-underline"
								inputClassName="border-gray-300/80 bg-white/85 shadow-sm"
							/>
							<div className="inline-flex size-9 flex-none items-center justify-center rounded-lg border border-gray-300/70 bg-white/65 shadow-sm">
								<SessionPlayButton
									itemType={type}
									itemId={selected.id}
								/>
							</div>
							<TaskDeleteButton
								taskId={selected.id}
								taskName={selected.name}
								className="size-9 rounded-lg"
							/>
						</div>
					</div>
					<button
						type="button"
						onClick={closeTray}
						className="inline-flex size-9 flex-none items-center justify-center rounded-lg border border-gray-300/70 bg-white/70 p-0 text-gray-600 shadow-sm transition-colors hover:bg-white hover:text-gray-950 focus-visible:outline-none"
						aria-label="Close task panel"
					>
						<X
							className="size-4"
							aria-hidden="true"
						/>
					</button>
				</header>

				<div className="flex-1 overflow-y-auto px-5 py-5">
					<section
						className="mb-4 rounded-lg border border-gray-300/70 bg-white/55 p-2.5 shadow-sm"
						aria-label="Task details"
					>
						<dl className="grid gap-1 text-sm">
							<div className="grid min-h-8 gap-1 rounded-md bg-white/40 px-2.5 py-1 sm:grid-cols-[7.25rem_minmax(0,1fr)] sm:items-center sm:gap-2">
								<dt className="text-xs font-semibold text-gray-500">
									Estimated Time
								</dt>
								<dd className="min-w-0 text-gray-900">
									<EditableNumber
										value={selected.estimatedTime}
										onSave={async (v) => {
											await actions.task.update(
												{
													id: selected.id,
													estimatedTime: v,
												} as Parameters<
													typeof actions.task.update
												>[0] & {
													estimatedTime: number | null
												},
											)
											applySavedTaskChange({
												estimatedTime: v,
											})
										}}
									/>
								</dd>
							</div>
							<div className="grid min-h-8 gap-1 rounded-md bg-white/40 px-2.5 py-1 sm:grid-cols-[7.25rem_minmax(0,1fr)] sm:items-center sm:gap-2">
								<dt className="text-xs font-semibold text-gray-500">
									Make Time Type
								</dt>
								<dd className="min-w-0 text-gray-900">
									<EditableMakeTimeType
										value={selected.makeTimeType}
										onSave={async (makeTimeType) => {
											await actions.task.update({
												id: selected.id,
												makeTimeType,
											})
											applySavedTaskChange({
												makeTimeType:
													makeTimeType === "none"
														? null
														: makeTimeType,
											})
										}}
									/>
								</dd>
							</div>
							<div className="grid min-h-8 gap-1 rounded-md bg-white/40 px-2.5 py-1 sm:grid-cols-[7.25rem_minmax(0,1fr)] sm:items-center sm:gap-2">
								<dt className="text-xs font-semibold text-gray-500">
									Status
								</dt>
								<dd className="min-w-0 text-gray-900">
									<EditableStatus
										value={selected.status as Status}
										onSave={async (status) => {
											await actions.task.update({
												id: selected.id,
												status,
											})
											applySavedTaskChange({ status })
										}}
									/>
								</dd>
							</div>
							<div className="grid min-h-8 gap-1 rounded-md bg-white/40 px-2.5 py-1 sm:grid-cols-[7.25rem_minmax(0,1fr)] sm:items-center sm:gap-2">
								<dt className="text-xs font-semibold text-gray-500">
									Deadline
								</dt>
								<dd className="min-w-0 text-gray-900">
									<EditableDate
										value={deadlineValue}
										onSave={async (date) => {
											const d = date
												? new Date(date)
												: null
											await actions.task.update({
												id: selected.id,
												deadline: d,
											})
											applySavedTaskChange({
												deadline: d,
											})
										}}
									/>
								</dd>
							</div>
						</dl>
					</section>

					<section className="rounded-lg border border-gray-300/70 bg-white/55 p-4 shadow-sm">
						<Subtasks taskId={selected.id} />
					</section>
				</div>

				{/* TODO: add past sessions, add notes area? */}
			</aside>
		</>
	)
}

function TaskBreadcrumbs({
	breadcrumbs,
	isLoading,
	onTaskSelect,
	selectedTaskId,
}: {
	breadcrumbs: TaskBreadcrumbItem[]
	isLoading: boolean
	onTaskSelect: (taskId: number) => Promise<void>
	selectedTaskId: number
}) {
	const items =
		breadcrumbs.length > 0
			? breadcrumbs
			: [
					{
						type: "task-root" as const,
						id: null,
						name: isLoading ? "Loading..." : "Task",
						href: null,
					},
				]

	return (
		<nav
			aria-label="Task breadcrumbs"
			className="mb-1 flex min-w-0 flex-wrap items-center gap-x-1 gap-y-0.5 pb-1 text-xs font-medium leading-snug text-gray-500"
		>
			{items.map((breadcrumb, index) => {
				const key = `${breadcrumb.type}-${breadcrumb.id ?? breadcrumb.name}-${index}`
				const isLast = index === items.length - 1
				const isSelectedTask =
					breadcrumb.type === "task" && breadcrumb.id === selectedTaskId
				const content = (
					<span className="min-w-0 break-words">
						{breadcrumb.name}
					</span>
				)

				return (
					<div
						key={key}
						className="flex min-w-0 max-w-full items-center gap-1"
					>
						{breadcrumb.href && !isLast ? (
							<a
								href={breadcrumb.href}
								className="min-w-0 max-w-full rounded-sm text-gray-600 transition-colors hover:text-gray-950 hover:underline focus-visible:outline-none"
							>
								{content}
							</a>
						) : breadcrumb.type === "task" &&
						  breadcrumb.id &&
						  !isSelectedTask ? (
							<button
								type="button"
								onClick={() => void onTaskSelect(breadcrumb.id!)}
								className="min-w-0 max-w-full rounded-sm text-left text-gray-600 transition-colors hover:text-gray-950 hover:underline focus-visible:outline-none"
							>
								{content}
							</button>
						) : (
							<span
								aria-current={isLast ? "page" : undefined}
								className={
									"min-w-0 max-w-full " +
									(isLast ? "text-gray-400" : "text-gray-500")
								}
							>
								{content}
							</span>
						)}
						{!isLast && (
							<ChevronRight
								className="size-3 flex-none text-gray-400"
								aria-hidden="true"
							/>
						)}
					</div>
				)
			})}
		</nav>
	)
}

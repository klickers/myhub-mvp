import type { Status, Task } from "@/generated/prisma/client"
import { toast } from "react-toastify"
import { actions } from "astro:actions"
import EditableText from "./form/EditableText"
import EditableNumber from "./form/EditableNumber"
import EditableStatus from "./form/EditableStatus"
import EditableDate from "./form/EditableDate"
import EditableTags from "./form/EditableTags"
import SessionPlayButton from "./models/session/SessionPlayButton"
import Tasks from "./models/task/Tasks"
import { ChevronRight, X } from "lucide-react"
import {
	useEffect,
	useMemo,
	useState,
	type Dispatch,
	type SetStateAction,
} from "react"
import TaskDeleteButton from "@/components/models/task/TaskDeleteButton"
import { dateKeyToUtcDate, getUtcDateKey } from "@/helpers/dateOnly"
import { useTasksStore } from "@/stores/tasks"
import { useTagsStore } from "@/stores/tags"

type Props = {
	type: "task"
	taskId: number
	setSelected: Dispatch<SetStateAction<any>>
}

type TaskBreadcrumbItem = {
	type: "area" | "task" | "task-root"
	id: number | null
	name: string
	href: string | null
}

export default function SideTray({ type, taskId, setSelected }: Props) {
	const task = useTasksStore((state) => state.getTaskById(taskId))
	const updateTask = useTasksStore((state) => state.updateTask)

	const tags = useTagsStore((state) => state.tags)
	const loadTags = useTagsStore((state) => state.loadTags)

	const [breadcrumbs, setBreadcrumbs] = useState<TaskBreadcrumbItem[]>([])
	const [breadcrumbsLoading, setBreadcrumbsLoading] = useState(false)
	const closeTray = () => setSelected(null)

	useEffect(() => {
		loadTags()
	}, [])

	// Handle Escape key to close the tray
	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") setSelected(null)
		}
		document.addEventListener("keydown", handleKeyDown)
		return () => document.removeEventListener("keydown", handleKeyDown)
	}, [setSelected])

	// Load breadcrumbs for the selected task
	useEffect(() => {
		let cancelled = false

		setBreadcrumbs([])
		setBreadcrumbsLoading(true)

		actions.task
			.breadcrumbs({ taskId })
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
	}, [taskId])

	const visibleBreadcrumbs = useMemo(
		() =>
			breadcrumbs.map((breadcrumb) =>
				breadcrumb.type === "task" && breadcrumb.id === taskId
					? { ...breadcrumb, name: task?.name || breadcrumb.name }
					: breadcrumb,
			),
		[breadcrumbs, taskId, task?.name],
	)

	const openTaskBreadcrumb = async (taskId: number) => {
		const res = await actions.task.getById({ id: taskId })
		if (res.data) setSelected(res.data)
	}

	const saveTaskChange = async (
		patch: Parameters<typeof actions.task.update>[0],
	) => {
		const res = await updateTask(patch.id, patch)
		if (res === undefined) toast.error("Failed to update task")
		else toast.success("Task updated successfully")
	}

	const deadlineValue = task?.deadline ? getUtcDateKey(task.deadline) : null

	return (
		<>
			{/* Backdrop */}
			<div
				className="fixed inset-0 z-40 bg-gray-900/10 backdrop-blur-[2px]"
				onClick={closeTray}
				aria-hidden="true"
			/>

			{/* Tray */}
			<aside
				role="dialog"
				aria-modal="true"
				aria-labelledby="side-tray-title"
				className="side-tray fixed bottom-3 right-3 top-3 z-50 flex w-[min(38rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-lg bg-white backdrop-blur-2xl backdrop-saturate-150 sm:bottom-4 sm:right-4 sm:top-4 sm:w-[min(44rem,calc(100vw-2rem))]"
				onClick={(e) => e.stopPropagation()}
			>
				<header className="flex items-start justify-between gap-4 border-b border-gray-300/60 px-5 py-4">
					<div className="min-w-0 flex-1">
						<p
							id="side-tray-title"
							className="sr-only"
						>
							Task details for {task?.name}
						</p>
						<TaskBreadcrumbs
							breadcrumbs={visibleBreadcrumbs}
							isLoading={breadcrumbsLoading}
							onTaskSelect={openTaskBreadcrumb}
							selectedTaskId={taskId}
						/>
						<div className="flex min-w-0 items-center gap-2">
							<EditableText
								value={task?.name}
								onSave={(name) =>
									saveTaskChange({
										id: task?.id,
										name,
									})
								}
								className="pl-0 text-xl font-semibold leading-tight hover:no-underline"
							/>
							<div className="inline-flex size-9 flex-none items-center justify-center">
								<SessionPlayButton
									itemType={type}
									itemId={task?.id}
								/>
							</div>
							<TaskDeleteButton
								taskId={task?.id}
								taskName={task?.name}
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
						className="mb-4"
						aria-label="Task details"
					>
						<dl className="grid gap-1 text-sm">
							<div className="grid gap-1 sm:grid-cols-[7.25rem_minmax(0,1fr)] sm:items-center sm:gap-2">
								<dt className="text-xs font-semibold text-gray-500">
									Status
								</dt>
								<dd>
									<EditableStatus
										value={task?.status as Status}
										onSave={(status) =>
											saveTaskChange({
												id: task?.id,
												status,
											})
										}
									/>
								</dd>
							</div>
							{/* TODO: hide relevant for Evergreen */}
							<div className="grid gap-1 sm:grid-cols-[7.25rem_minmax(0,1fr)] sm:items-center sm:gap-2">
								<dt className="text-xs font-semibold text-gray-500">
									Estimated Time
								</dt>
								<dd>
									<EditableNumber
										value={task?.estimatedTime}
										onSave={(v) =>
											saveTaskChange({
												id: task?.id,
												estimatedTime: v,
											} as Parameters<
												typeof actions.task.update
											>[0] & {
												estimatedTime: number | null
											})
										}
									/>
								</dd>
							</div>
							<div className="grid gap-1 sm:grid-cols-[7.25rem_minmax(0,1fr)] sm:items-center sm:gap-2">
								<dt className="text-xs font-semibold text-gray-500">
									Deadline
								</dt>
								<dd>
									<EditableDate
										value={deadlineValue}
										onSave={(date) =>
											saveTaskChange({
												id: task?.id,
												deadline: date
													? dateKeyToUtcDate(date)
													: null,
											})
										}
									/>
								</dd>
							</div>
							<div className="grid gap-1 sm:grid-cols-[7.25rem_minmax(0,1fr)] sm:items-center sm:gap-2">
								<dt className="text-xs font-semibold text-gray-500">
									Tags
								</dt>
								<dd>
									<EditableTags
										value={task.tags.map((tag) => tag.tag)}
										tags={tags}
										onSave={(tags) =>
											saveTaskChange({
												id: task?.id,
												tags: tags.map((tag) => tag.id),
											})
										}
										tagClassName="px-2 py-1"
									/>
								</dd>
							</div>
						</dl>
					</section>

					<section
						className="mt-6"
						aria-label="Subtasks"
					>
						<h2 className="text-lg">Subtasks</h2>
						<Tasks filter={{ type: "task", id: task?.id }} />
					</section>
				</div>

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
					breadcrumb.type === "task" &&
					breadcrumb.id === selectedTaskId
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
								onClick={() =>
									void onTaskSelect(breadcrumb.id!)
								}
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

import type { Status } from "@/generated/prisma/client"
import { toast } from "react-toastify"
import { actions } from "astro:actions"
import EditableText from "./form/EditableText"
import EditableNumber from "./form/EditableNumber"
import EditableStatus from "./form/EditableStatus"
import EditableDate from "./form/EditableDate"
import EditableTags from "./form/EditableTags"
import EditableBoolean from "./form/EditableBoolean"
import SessionPlayButton from "./models/session/SessionPlayButton"
import { useEffect, useMemo, useState } from "react"
import { Icon } from "@iconify/react"
// import TrashButton from "@/components/TrashButton"
import { dateKeyToUtcDate, getUtcDateKey } from "@/helpers/dateOnly"
import saveTaskChange from "@/helpers/saveTaskChange"
import { useTasksStore } from "@/stores/tasks"
import { useTagsStore } from "@/stores/tags"
import { useNotesStore } from "@/stores/notes"
import Wrapper from "./Wrapper"
import EditorWrapper from "./EditorWrapper"
import TrashButton from "./TrashButton"

type TaskBreadcrumbItem = {
	type: "area" | "task" | "task-root"
	id: number | null
	name: string
	href: string | null
}

export default function SideTray() {
	const setSelectedTaskId = useTasksStore((state) => state.setSelectedTaskId)
	const selectedTaskId = useTasksStore((state) => state.selectedTaskId)
	const isSideTrayOpen = useTasksStore((state) => state.isSideTrayOpen)
	const closeSideTray = useTasksStore((state) => state.closeSideTray)

	const task = useTasksStore((state) =>
		state.tasks.find((task) => task.id === selectedTaskId),
	)
	const loadTasks = useTasksStore((state) => state.loadTasks)
	// const removeTask = useTasksStore((state) => state.removeTask)

	const tags = useTagsStore((state) => state.tags)
	const loadTags = useTagsStore((state) => state.loadTags)

	const loadNotes = useNotesStore((state) => state.loadNotes)
	const createNote = useNotesStore((state) => state.createNote)
	const updateNote = useNotesStore((state) => state.updateNote)
	const removeNote = useNotesStore((state) => state.removeNote)
	const notes = useNotesStore((state) => state.notes)

	const [breadcrumbs, setBreadcrumbs] = useState<TaskBreadcrumbItem[]>([])
	const [breadcrumbsLoading, setBreadcrumbsLoading] = useState(false)

	useEffect(() => {
		loadTasks()
		loadTags()
		loadNotes()
	}, [])

	// Handle Escape key to close the tray
	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") setSelectedTaskId(null)
		}
		document.addEventListener("keydown", handleKeyDown)
		return () => document.removeEventListener("keydown", handleKeyDown)
	}, [setSelectedTaskId])

	// Load breadcrumbs for the selected task
	useEffect(() => {
		if (selectedTaskId) {
			let cancelled = false

			setBreadcrumbs([])
			setBreadcrumbsLoading(true)

			actions.task
				.breadcrumbs({ taskId: selectedTaskId })
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
		}
	}, [selectedTaskId])

	const visibleBreadcrumbs = useMemo(
		() =>
			breadcrumbs.map((breadcrumb) =>
				breadcrumb.type === "task" && breadcrumb.id === selectedTaskId
					? { ...breadcrumb, name: task?.name || breadcrumb.name }
					: breadcrumb,
			),
		[breadcrumbs, selectedTaskId, task?.name],
	)

	const openTaskBreadcrumb = async (taskId: number) => {
		const res = await actions.task.getById({ id: taskId })
		if (res.data) setSelectedTaskId(res.data.id)
	}

	// const handleTaskDelete = async (id: number) => {
	// 	const res = await removeTask(id)
	// 	if (res === undefined) toast.error("Failed to delete task")
	// 	else {
	// 		toast.success("Task deleted successfully")
	// 		closeSideTray()
	// 	}
	// }

	const saveNoteChange = (
		noteId: number,
		patch: Parameters<typeof updateNote>[1],
	) => {
		const res = updateNote(noteId, patch)
		if (res === undefined) toast.error("Failed to save note")
		else toast.success("Note saved successfully")
	}

	if (!selectedTaskId || !isSideTrayOpen || !task) {
		closeSideTray()
		return null
	}
	return (
		<>
			{/* Backdrop */}
			<div
				className="fixed inset-0 z-40 bg-gray-900/10 backdrop-blur-[2px]"
				onClick={closeSideTray}
				aria-hidden="true"
			/>

			{/* Tray */}
			<aside
				role="dialog"
				aria-modal="true"
				aria-labelledby="side-tray-title"
				className="side-tray fixed bottom-3 right-3 top-3 z-50 flex w-[min(38rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-lg bg-white backdrop-blur-2xl backdrop-saturate-150 sm:bottom-4 sm:right-4 sm:top-4 sm:w-[min(95%,calc(100vw-2rem))]"
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
							selectedTaskId={selectedTaskId}
						/>
						<div className="flex min-w-0 items-center gap-2">
							<EditableText
								value={task.name}
								onSave={(name) =>
									saveTaskChange({
										id: task.id,
										name,
									})
								}
								className="w-full pl-0 text-xl font-semibold leading-tight hover:no-underline"
								inputClassName="w-full"
							/>
							<div className="inline-flex size-9 flex-none items-center justify-center">
								<SessionPlayButton
									itemType="task"
									itemId={task.id}
								/>
								{/* <TrashButton
									className="ml-1"
									onClick={() => handleTaskDelete(task.id)}
								/> */}
							</div>
						</div>
					</div>
					<button
						type="button"
						onClick={closeSideTray}
						aria-label="Close task panel"
					>
						<Icon icon="mingcute:close-fill" />
					</button>
				</header>

				<div className="flex overflow-hidden h-full">
					<div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
						<section
							aria-label="Task details"
							className="border-b border-gray-200 pb-5"
						>
							<dl className="grid grid-cols-2 gap-6 items-start text-sm">
								<div className="space-y-1 sm:space-y-2">
									<div className="grid gap-1 sm:grid-cols-[7.25rem_minmax(0,1fr)] sm:items-center sm:gap-2">
										<dt className="text-xs font-semibold text-gray-500">
											Status
										</dt>
										<dd>
											<EditableStatus
												value={task.status as Status}
												onSave={(status) =>
													saveTaskChange({
														id: task.id,
														status,
													})
												}
												className="text-xs"
											/>
										</dd>
									</div>
									{!task.isEvergreen && (
										<>
											<div className="grid gap-1 sm:grid-cols-[7.25rem_minmax(0,1fr)] sm:items-center sm:gap-2">
												<dt className="text-xs font-semibold text-gray-500">
													Estimated Time
												</dt>
												<dd>
													<EditableNumber
														value={
															task.estimatedTime
														}
														onSave={(v) =>
															saveTaskChange({
																id: task.id,
																estimatedTime:
																	v,
															} as Parameters<
																typeof actions.task.update
															>[0] & {
																estimatedTime:
																	| number
																	| null
															})
														}
														className="text-xs pl-0"
														inputClassName="text-xs"
													/>
												</dd>
											</div>
											<div className="grid gap-1 sm:grid-cols-[7.25rem_minmax(0,1fr)] sm:items-center sm:gap-2">
												<dt className="text-xs font-semibold text-gray-500">
													Start Date
												</dt>
												<dd>
													<EditableDate
														value={
															task?.startDate
																? getUtcDateKey(
																		task.startDate,
																	)
																: null
														}
														onSave={(date) =>
															saveTaskChange({
																id: task.id,
																startDate: date
																	? dateKeyToUtcDate(
																			date,
																		)
																	: null,
															})
														}
														className="text-xs"
													/>
												</dd>
											</div>
											<div className="grid gap-1 sm:grid-cols-[7.25rem_minmax(0,1fr)] sm:items-center sm:gap-2">
												<dt className="text-xs font-semibold text-gray-500">
													Deadline
												</dt>
												<dd>
													<EditableDate
														value={
															task?.deadline
																? getUtcDateKey(
																		task.deadline,
																	)
																: null
														}
														onSave={(date) =>
															saveTaskChange({
																id: task.id,
																deadline: date
																	? dateKeyToUtcDate(
																			date,
																		)
																	: null,
															})
														}
														className="text-xs"
													/>
												</dd>
											</div>
										</>
									)}
									<div className="grid gap-1 sm:grid-cols-[7.25rem_minmax(0,1fr)] sm:items-center sm:gap-2">
										<dt className="text-xs font-semibold text-gray-500">
											Tags
										</dt>
										<dd>
											<EditableTags
												value={task.tags.map(
													(tag) => tag.tag,
												)}
												tags={tags}
												onSave={(tags) =>
													saveTaskChange({
														id: task.id,
														tags: tags.map(
															(tag) => tag.id,
														),
													})
												}
												tagClassName="px-2 py-1"
											/>
										</dd>
									</div>
								</div>
								<div className="grid gap-1 sm:grid-cols-[7.25rem_minmax(0,1fr)] sm:items-center sm:gap-2">
									<dt className="text-xs font-semibold text-gray-500">
										Evergreen
									</dt>
									<dd>
										<EditableBoolean
											value={task.isEvergreen}
											onSave={(isEvergreen) =>
												saveTaskChange({
													id: task.id,
													isEvergreen,
												})
											}
										/>
									</dd>
								</div>
							</dl>
						</section>

						<section>
							<Wrapper filter={{ type: "task", id: task.id }} />
						</section>
					</div>

					<div className="w-1/2 flex-1 overflow-y-auto px-5 py-5">
						<div className="flex gap-1 mb-4">
							<button
								className="button"
								onClick={async () => {
									const res = await createNote(
										task.id,
										"Note for " + task.name,
									)
									if (res === undefined)
										toast.error("Failed to create note")
									else
										toast.success(
											"Note created successfully",
										)
								}}
							>
								<Icon icon="mingcute:add-fill" />
								<span>Add Note</span>
							</button>
							<button className="button">
								<Icon icon="mingcute:add-fill" />
								<span>Link Note</span>
							</button>
						</div>
						{task.notes.map(({ noteId }) => (
							<div className="mb-4">
								<div className="flex items-center gap-2 justify-between">
									<EditableText
										value={
											notes[noteId]?.title ||
											"Untitled Note"
										}
										onSave={async (value) =>
											saveNoteChange(noteId, {
												id: noteId,
												title: value,
											})
										}
										className="text-base font-semibold mb-2"
										inputClassName="mb-0"
									/>
									<TrashButton
										onClick={() => {
											const res = removeNote(noteId)
											if (res === undefined)
												toast.error(
													"Failed to delete note",
												)
											else
												toast.success(
													"Note deleted successfully",
												)
										}}
									/>
								</div>
								<EditorWrapper
									key={noteId}
									noteId={noteId}
									initialValue={notes[noteId]?.content}
									onSave={(noteId, content) =>
										saveNoteChange(noteId, {
											id: noteId,
											content,
										})
									}
									placeholder="Start typing here..."
								/>
							</div>
						))}
					</div>
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
							<Icon
								icon="mingcute:right-fill"
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

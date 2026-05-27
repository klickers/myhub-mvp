import type { Status, Task } from "@/generated/prisma/client"
import EditableText from "./form/EditableText"
import { actions } from "astro:actions"
import SessionPlayButton from "./models/session/SessionPlayButton"
import EditableNumber from "./form/EditableNumber"
import EditableMakeTimeType from "./form/EditableMakeTimeType"
import EditableStatus from "./form/EditableStatus"
import EditableDate from "./form/EditableDate"
import Subtasks from "./models/task/Subtasks"
import { X } from "lucide-react"
import { useEffect, type Dispatch, type SetStateAction } from "react"

type Props = {
	type: "task"
	selected: Task
	selectedId?: never
	setSelected: Dispatch<SetStateAction<any>>
}
// | {
// 		type: "task"
// 		selected?: never
// 		selectedId: number
// 		setSelected: (id: number) => void
//   }

export default function SideTray({
	type,
	selected,
	// selectedId,
	setSelected,
}: Props) {
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

	const deadlineValue = selected.deadline
		? new Date(selected.deadline).toISOString()
		: null

	return (
		<>
			{/* TODO: add breadcrumbs */}

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
				className="side-tray fixed bottom-3 right-3 top-3 z-50 flex w-[min(38rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-lg border border-gray-300/70 bg-white/70 shadow-2xl shadow-slate-900/15 ring-1 ring-white/50 backdrop-blur-2xl backdrop-saturate-150 sm:bottom-4 sm:right-4 sm:top-4 sm:w-[min(40rem,calc(100vw-2rem))]"
				onClick={(e) => e.stopPropagation()}
			>
				<header className="flex items-start justify-between gap-4 border-b border-gray-300/60 bg-white/45 px-5 py-4">
					<div className="min-w-0 flex-1">
						<p
							id="side-tray-title"
							className="mb-1 text-xs font-semibold uppercase text-gray-500"
						>
							Task
						</p>
						<div className="flex min-w-0 items-center gap-2">
							<EditableText
								value={selected.name}
								onSave={async (name) => {
									await actions.task.update({
										id: selected.id,
										name,
									})
									setSelected((s: Task | null) =>
										s ? { ...s, name } : s,
									)
								}}
								className="min-h-9 min-w-0 flex-1 rounded-md px-1 py-0.5 text-left text-xl font-semibold leading-tight text-gray-950 transition-colors hover:bg-white/55 hover:no-underline"
								inputClassName="border-gray-300/80 bg-white/85 shadow-sm focus:ring-brand/35"
							/>
							<div className="inline-flex size-9 flex-none items-center justify-center rounded-lg border border-gray-300/70 bg-white/65 shadow-sm">
								<SessionPlayButton
									itemType={type}
									itemId={selected.id}
								/>
							</div>
						</div>
					</div>
					<button
						type="button"
						onClick={closeTray}
						className="inline-flex size-9 flex-none items-center justify-center rounded-lg border border-gray-300/70 bg-white/70 p-0 text-gray-600 shadow-sm transition-colors hover:bg-white hover:text-gray-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/45 focus-visible:ring-offset-2"
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
						className="mb-4 rounded-lg border border-gray-300/70 bg-white/55 p-2.5 shadow-sm ring-1 ring-white/40"
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
											await actions.task.update({
												id: selected.id,
												estimatedTime:
													v ?? undefined,
											})
											setSelected((s: Task | null) =>
												s
													? {
															...s,
															estimatedTime: v,
														}
													: s,
											)
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
											setSelected((s: Task | null) =>
												s
													? {
															...s,
															makeTimeType:
																makeTimeType ===
																"none"
																	? null
																	: makeTimeType,
														}
													: s,
											)
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
											setSelected((s: Task | null) =>
												s ? { ...s, status } : s,
											)
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
											setSelected((s: Task | null) =>
												s
													? { ...s, deadline: d }
													: s,
											)
										}}
									/>
								</dd>
							</div>
						</dl>
					</section>

					<section className="rounded-lg border border-gray-300/70 bg-white/55 p-4 shadow-sm ring-1 ring-white/40">
						<Subtasks taskId={selected.id} />
					</section>
				</div>

				{/* TODO: add past sessions, add notes area? */}
			</aside>
		</>
	)
}

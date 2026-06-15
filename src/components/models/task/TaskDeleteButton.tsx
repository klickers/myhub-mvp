import { actions } from "astro:actions"
import { Icon } from "@iconify/react"
import { useState, type MouseEvent } from "react"
import {
	AlertDialog,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/editor/ui/alert-dialog"
import { cn } from "@/lib/utils"
import { dispatchTaskRemoved } from "@/helpers/taskEvents"

type DeletionImpact = {
	taskIds: number[]
	descendantTaskCount: number
	sessionCount: number
}

type Props = {
	taskId: number
	taskName: string
	className?: string
	onRemoved?: (taskIds: number[]) => void | Promise<void>
}

export default function TaskDeleteButton({
	taskId,
	taskName,
	className,
	onRemoved,
}: Props) {
	const [open, setOpen] = useState(false)
	const [impact, setImpact] = useState<DeletionImpact | null>(null)
	const [loadingImpact, setLoadingImpact] = useState(false)
	const [saving, setSaving] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const hasLinkedData =
		Boolean(impact) &&
		(impact!.descendantTaskCount > 0 || impact!.sessionCount > 0)

	const getRemovedTaskIds = (taskIds?: number[]) => {
		if (taskIds && taskIds.length > 0) return taskIds
		if (impact?.taskIds && impact.taskIds.length > 0) return impact.taskIds
		return [taskId]
	}

	const openDialog = async (event: MouseEvent<HTMLButtonElement>) => {
		event.stopPropagation()
		setOpen(true)
		setImpact(null)
		setError(null)
		setLoadingImpact(true)

		try {
			const res = await actions.task.deletionImpact({ id: taskId })
			if (res.error) throw new Error(res.error.message)
			setImpact(res.data ?? null)
		} catch (cause) {
			console.error("Failed to load task deletion impact", cause)
			setError("Could not check what this task is connected to.")
		} finally {
			setLoadingImpact(false)
		}
	}

	const closeDialog = (nextOpen: boolean) => {
		if (saving) return
		setOpen(nextOpen)
		if (!nextOpen) {
			setImpact(null)
			setError(null)
		}
	}

	const finishRemoval = async (taskIds: number[]) => {
		setOpen(false)
		setImpact(null)
		setError(null)
		dispatchTaskRemoved(taskIds)
		await onRemoved?.(taskIds)
	}

	const archiveTask = async () => {
		if (saving) return
		setSaving(true)
		setError(null)

		try {
			const res = await actions.task.archiveTree({ id: taskId })
			if (res.error) throw new Error(res.error.message)
			setSaving(false)
			await finishRemoval(getRemovedTaskIds(res.data?.taskIds))
		} catch (cause) {
			console.error("Failed to archive task", cause)
			setError("Could not archive this task.")
			setSaving(false)
		}
	}

	const deleteTask = async () => {
		if (saving) return
		setSaving(true)
		setError(null)

		try {
			const res = await actions.task.deleteTree({ id: taskId })
			if (res.error) throw new Error(res.error.message)
			setSaving(false)
			await finishRemoval(getRemovedTaskIds(res.data?.taskIds))
		} catch (cause) {
			console.error("Failed to delete task", cause)
			setError("Could not delete this task.")
			setSaving(false)
		}
	}

	return (
		<>
			<button
				type="button"
				onClick={openDialog}
				className={cn(
					"inline-flex size-8 flex-none items-center justify-center rounded-md border border-gray-300/70 bg-white/65 p-0 text-gray-500 shadow-sm transition-colors hover:bg-rose-50 hover:text-rose-700 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60",
					className,
				)}
				disabled={saving}
				aria-label={`Delete ${taskName}`}
			>
				<Icon
					icon="mingcute:delete-2-line"
					className="size-4"
					aria-hidden="true"
				/>
			</button>

			<AlertDialog
				open={open}
				onOpenChange={closeDialog}
			>
				<AlertDialogContent
					onClick={(event) => event.stopPropagation()}
					className="border-gray-300/80 bg-white text-gray-950"
				>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete {taskName}?</AlertDialogTitle>
						<AlertDialogDescription className="space-y-2 text-gray-600">
							{loadingImpact ? (
								<span>Checking linked subtasks and sessions...</span>
							) : hasLinkedData ? (
								<>
									<span className="block">
										This affects{" "}
										<strong className="font-semibold text-gray-800">
											{impact!.descendantTaskCount}
										</strong>{" "}
										nested{" "}
										{impact!.descendantTaskCount === 1
											? "subtask"
											: "subtasks"}{" "}
										and{" "}
										<strong className="font-semibold text-gray-800">
											{impact!.sessionCount}
										</strong>{" "}
										linked{" "}
										{impact!.sessionCount === 1
											? "session"
											: "sessions"}
										.
									</span>
									<span className="block">
										Archive keeps session history. Delete permanently removes
										the task tree and linked sessions.
									</span>
								</>
							) : (
								<span>
									This task has no nested subtasks or linked sessions. This
									will permanently delete it.
								</span>
							)}
						</AlertDialogDescription>
					</AlertDialogHeader>

					{error && (
						<p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
							{error}
						</p>
					)}

					<AlertDialogFooter>
						<AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
						{hasLinkedData && (
							<button
								type="button"
								onClick={() => void archiveTask()}
								disabled={loadingImpact || saving}
								className="inline-flex h-9 items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-xs transition-colors hover:bg-gray-50 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none"
							>
								{saving ? "Working..." : "Archive"}
							</button>
						)}
						<button
							type="button"
							onClick={() => void deleteTask()}
							disabled={loadingImpact || saving || Boolean(error && !impact)}
							className="inline-flex h-9 items-center justify-center rounded-md bg-rose-700 px-4 py-2 text-sm font-medium text-white shadow-xs transition-colors hover:bg-rose-800 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none"
						>
							{saving ? "Working..." : "Delete permanently"}
						</button>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	)
}

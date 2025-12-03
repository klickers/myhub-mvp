import React, { useEffect, useState, useRef } from "react"
import SessionPlayButton from "./SessionPlayButton"
import { actions } from "astro:actions"
import { useStore } from "@nanostores/react"
import { playingSession } from "@/stores/playingSession"
import { secondsToDots } from "@/helpers/time/secondsToDots"
import { differenceInSeconds } from "date-fns"

interface Objective {
	id: number
	name: string
}

interface Task {
	id: number
	name: string
}

interface Props {
	objectives: Objective[]
	tasks: Task[]
}

const SessionPlayer: React.FC<Props> = ({ objectives, tasks }) => {
	const [itemType, setItemType] = useState<"objective" | "task">("objective")
	const [itemId, setItemId] = useState<number | null>(null)
	const [notes, setNotes] = useState("")
	const [lastSaved, setLastSaved] = useState<string | null>(null)
	const [usedTime, setUsedTime] = useState<string>("00:00:00")

	const $playingSession = useStore(playingSession)
	const autosaveTimer = useRef<NodeJS.Timeout | null>(null)
	const lastSentNotes = useRef<string>("")

	// ---------------------------------------------------
	// Load existing session (itemType, itemId, notes)
	// ---------------------------------------------------
	useEffect(() => {
		const loadSessionData = async () => {
			if (!$playingSession.isPlaying || !$playingSession.id) return

			const { data } = await actions.getSession({
				id: $playingSession.id,
			})
			if (!data) return

			// Set correct item type + id
			if (data.itemType === "objective" && data.objectiveId) {
				setItemType("objective")
				setItemId(data.objectiveId)
			} else if (data.itemType === "task" && data.taskId) {
				setItemType("task")
				setItemId(data.taskId)
			}

			// Set notes
			if (data.notes && data.notes !== lastSentNotes.current) {
				setNotes(data.notes)
				lastSentNotes.current = data.notes
			}
		}

		loadSessionData()
	}, [$playingSession.id, $playingSession.isPlaying])

	// ---------------------------------------------------
	// Autosave notes (500ms debounce)
	// ---------------------------------------------------
	useEffect(() => {
		if (!$playingSession.isPlaying) return
		if (notes === lastSentNotes.current) return

		if (autosaveTimer.current) clearTimeout(autosaveTimer.current)

		autosaveTimer.current = setTimeout(async () => {
			if (!$playingSession.id) return

			await actions.updateSessionNotes({
				id: $playingSession.id,
				notes: notes.trim(),
			})

			lastSentNotes.current = notes
			setLastSaved(new Date().toLocaleTimeString())
		}, 500)

		return () => {
			if (autosaveTimer.current) clearTimeout(autosaveTimer.current)
		}
	}, [notes, $playingSession])

	// ---------------------------------------------------
	// Update timer display
	// ---------------------------------------------------
	useEffect(() => {
		if (!$playingSession.startTime || !$playingSession.objectiveId) return
		const interval = setInterval(() => {
			setUsedTime(
				secondsToDots(
					differenceInSeconds(new Date(), $playingSession.startTime!)
				)
			)
		}, 1000)
		return () => clearInterval(interval)
	}, [$playingSession])

	const itemList = itemType === "objective" ? objectives : tasks

	const isSessionPlaying = $playingSession.isPlaying && $playingSession.id

	return (
		<div className="flex flex-col gap-2 border border-black p-4">
			<div className="flex gap-2 items-center">
				<select
					value={itemType}
					onChange={(e) => {
						const t = e.target.value as "objective" | "task"
						setItemType(t)
						setItemId(null)
					}}
					className="p-1"
				>
					<option value="objective">Objective</option>
					<option value="task">Task</option>
				</select>

				<select
					value={itemId ?? ""}
					onChange={(e) => setItemId(parseInt(e.target.value))}
					className="p-1"
				>
					<option
						value=""
						disabled
					>
						Select {itemType}
					</option>
					{itemList.map((i) => (
						<option
							key={i.id}
							value={i.id}
						>
							{i.name}
						</option>
					))}
				</select>

				{itemId && (
					<>
						<p className="text-xs font-mono">{usedTime}</p>
						<SessionPlayButton
							itemType={itemType}
							itemId={itemId}
						/>
					</>
				)}
			</div>

			{isSessionPlaying && (
				<div className="flex flex-col gap-1">
					<textarea
						value={notes}
						onChange={(e) => setNotes(e.target.value)}
						placeholder="Notes..."
						className="p-2 h-24 border border-black"
					/>

					{lastSaved && (
						<div className="text-xs">Saved at {lastSaved}</div>
					)}
				</div>
			)}
		</div>
	)
}

export default SessionPlayer

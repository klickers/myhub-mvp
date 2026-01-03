import React, { useEffect, useState, useRef } from "react"
import SessionPlayButton from "./SessionPlayButton"
import { actions } from "astro:actions"
import { useStore } from "@nanostores/react"
import { playingSession } from "@/stores/playingSession"
import { secondsToDots } from "@/helpers/time/secondsToDots"
import { differenceInSeconds } from "date-fns"

import { Plate, usePlateEditor, type TPlateEditor } from "platejs/react"
import { Editor, EditorContainer } from "@/components/editor/ui/editor"
import { EditorKit } from "@/components/editor/editor-kit"
import type { Prisma } from "@/generated/prisma/client"
import { type Value } from "platejs"

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
	const [notes, setNotes] = useState<Prisma.JsonArray>([])
	const [lastSaved, setLastSaved] = useState<string | null>(null)
	const [usedTime, setUsedTime] = useState<string>("00:00:00")

	const $playingSession = useStore(playingSession)
	const autosaveTimer = useRef<NodeJS.Timeout | null>(null)
	const lastSentNotes = useRef<Prisma.JsonArray>([])

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
			if ((data.notesJson as Array<any>).length == 0) {
				setNotes([])
				lastSentNotes.current = []
				editor.tf.reset()
			} else if (data.notesJson !== lastSentNotes.current) {
				setNotes(data.notesJson as Prisma.JsonArray)
				lastSentNotes.current = data.notesJson as Prisma.JsonArray
				editor.children = data.notesJson as Value
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
			await actions.updateSessionNotesJson({
				id: $playingSession.id,
				notesJson: notes as Prisma.JsonArray,
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
		if (!$playingSession.startTime || !$playingSession.itemId) return
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

	const editor = usePlateEditor({
		plugins: EditorKit,
		value: notes as Value,
	})

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
			{/* {isSessionPlaying && (
				<div className="flex flex-col gap-1 relative">
					<textarea
						value={notes}
						onChange={(e) => setNotes(e.target.value)}
						placeholder="Notes..."
						className="p-2 h-24 border border-black focus:outline-none"
					/>

					{lastSaved && (
						<div className="text-xs absolute bottom-2 left-2 text-gray-500">
							saved at {lastSaved}
						</div>
					)}
				</div>
			)} */}
			{isSessionPlaying && (
				<div className="relative">
					<Plate
						onValueChange={({ value }) => {
							setNotes(value as Prisma.JsonArray)
						}}
						editor={editor}
					>
						<EditorContainer className="editor">
							<Editor placeholder="Notes here..." />
						</EditorContainer>
					</Plate>

					{lastSaved && (
						<div className="text-xs absolute bottom-2 left-2 text-gray-500">
							saved at {lastSaved}
						</div>
					)}
				</div>
			)}
		</div>
	)
}

export default SessionPlayer

import React, { useEffect, useState, useRef } from "react"
import SessionPlayButton from "./SessionPlayButton"
import { actions } from "astro:actions"
import { useStore } from "@nanostores/react"
import { playingSession } from "@/stores/playingSession"
import { secondsToDots } from "@/helpers/time/secondsToDots"
import { differenceInSeconds } from "date-fns"

import { Plate, usePlateEditor } from "platejs/react"
import { Editor, EditorContainer } from "@/components/editor/ui/editor"
import { EditorKit } from "@/components/editor/editor-kit"
import type { Prisma } from "@/generated/prisma/client"
import { type Value } from "platejs"
import { initPlayingSession } from "@/helpers/initPlayingSession"

// interface Objective {
// 	id: number
// 	name: string
// }

// interface Task {
// 	id: number
// 	name: string
// }

type SessionItemType =
	| "objective"
	| "none"
	| "guild"
	| "contract"
	| "experiment"
	| "task"

interface Props {
	// objectives: Objective[]
	// tasks: Task[]
}

const SessionPlayer: React.FC<Props> = ({}) => {
	const [itemType, setItemType] = useState<SessionItemType>("task")
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
			if (data.itemType === "objective" && data.objectiveId)
				setItemId(data.objectiveId)
			else if (data.itemType === "guild" && data.guildId)
				setItemId(data.guildId)
			else if (data.itemType === "contract" && data.contractId)
				setItemId(data.contractId)
			else if (data.itemType === "experiment" && data.experimentId)
				setItemId(data.experimentId)
			else if (data.itemType === "task" && data.taskId)
				setItemId(data.taskId)
			setItemType(data.itemType)

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

		initPlayingSession()
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

	// const itemList = itemType === "objective" ? objectives : tasks

	const isSessionPlaying = $playingSession.isPlaying && $playingSession.id

	const editor = usePlateEditor({
		plugins: EditorKit,
		value: notes as Value,
	})

	let href = "#"
	if ($playingSession?.slug) {
		switch ($playingSession.itemType) {
			case "guild":
				href = `/hall/guilds/${$playingSession.slug}`
				break
			case "contract":
				href = `/hall/contracts/${$playingSession.slug}`
				break
			case "objective":
				href = `/objectives/${$playingSession.slug}`
				break
		}
	}

	return (
		<div className="flex flex-col gap-2">
			<div className="flex gap-2 items-center">
				{itemId && (
					<>
						<p>
							<a href={href}>{$playingSession.title}</a>
						</p>
						<p className="text-xs font-mono">{usedTime}</p>
						<SessionPlayButton
							itemType={itemType}
							itemId={itemId}
						/>
					</>
				)}
			</div>
			{isSessionPlaying && (
				<div>
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
					<div className="relative">
						{lastSaved && (
							<div className="text-xs absolute top-1 left-0 text-gray-500">
								saved at {lastSaved}
							</div>
						)}
					</div>
				</div>
			)}
		</div>
	)
}

export default SessionPlayer

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { useNotesStore } from "@/stores/notes"
import Note from "@/components/models/note/Note"
import type { Note as NoteType } from "@/generated/prisma/client"

export default function Notes() {
	const loadNotes = useNotesStore((state) => state.loadNotes)
	const allNotes = useNotesStore((state) => state.notes)
	const [notes, setNotes] = useState<[number, NoteType][]>([])
	const [currentNoteId, setCurrentNoteId] = useState<number | null>(null)
	const [filteredNotes, setFilteredNotes] = useState<[number, NoteType][]>([])

	useEffect(() => {
		loadNotes()
	}, [])

	useEffect(() => {
		setNotes(
			Object.entries(allNotes)
				.map(([id, note]) => [Number(id), note] as [number, NoteType])
				.sort(([, note], [, note2]) =>
					note.updatedAt < note2.updatedAt ? 1 : -1,
				),
		)
	}, [allNotes])

	useEffect(() => {
		if (filteredNotes.length === 0) setFilteredNotes(notes)
		else
			setFilteredNotes((prevFilteredNotes) =>
				prevFilteredNotes.map(([id, note]) => [
					id,
					notes.find(([noteId]) => noteId === id)?.[1] || note,
				]),
			)
	}, [notes])

	return (
		<div className="flex gap-6">
			<div className="w-1/4">
				<input
					type="text"
					placeholder="Search notes..."
					onChange={(e) => {
						const searchTerm = e.target.value
						if (searchTerm)
							setFilteredNotes(
								notes.filter(
									([, note]) =>
										note.title &&
										note.title
											.toLowerCase()
											.includes(searchTerm.toLowerCase()),
								),
							)
						else setFilteredNotes(notes)
					}}
					className="w-full mb-2"
				/>
				<div className="max-h-screen overflow-y-auto pr-1">
					{filteredNotes.map(([id, note]) => (
						<button
							key={id}
							onClick={() => setCurrentNoteId(Number(id))}
							className={
								"block w-full py-1.5 text-left text-sm border-b border-gray-200 hover:bg-gray-100" +
								(currentNoteId === Number(id)
									? " font-medium bg-gray-100"
									: "")
							}
						>
							<span>{note.title}</span>
							<span className="block italic text-xs text-gray-500">
								{"updated " + format(note.updatedAt, "h:mm a")}
							</span>
						</button>
					))}
				</div>
			</div>
			<div className="flex-1 max-h-screen overflow-y-auto pr-3">
				{currentNoteId !== null ? (
					<Note id={currentNoteId} />
				) : (
					<div>Select a note to view</div>
				)}
			</div>
		</div>
	)
}

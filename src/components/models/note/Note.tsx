import { useCallback } from "react"
import { toast } from "react-toastify"
import { useNotesStore } from "@/stores/notes"
import EditableText from "@/components/form/EditableText"
import TrashButton from "@/components/TrashButton"
import EditorWrapper from "@/components/EditorWrapper"

export default function Note({ id }: { id: number }) {
	const note = useNotesStore((state) => state.notes[id])
	const updateNote = useNotesStore((state) => state.updateNote)
	const removeNote = useNotesStore((state) => state.removeNote)

	// const saveNoteChange = (
	// 	noteId: number,
	// 	patch: Parameters<typeof updateNote>[1],
	// ) => {
	// 	const res = updateNote(noteId, patch)
	// 	if (res === undefined) toast.error("Failed to save note")
	// 	else toast.success("Note saved successfully")
	// }
	const saveNoteChange = useCallback(
		async (noteId: number, patch: Parameters<typeof updateNote>[1]) => {
			const res = await updateNote(noteId, patch)
			if (res === undefined)
				toast.error("Failed to save note", {
					toastId: `note-save-${noteId}`,
				})
			else
				toast.success("Note saved successfully", {
					toastId: `note-save-${noteId}`,
				})
		},
		[updateNote],
	)

	return (
		<div className="mb-4">
			<div className="flex items-center gap-2 justify-between">
				<EditableText
					value={note?.title || "Untitled Note"}
					onSave={async (value) =>
						saveNoteChange(note.id, {
							id: note.id,
							title: value,
						})
					}
					className="text-base font-semibold mb-2"
					inputClassName="mb-0 w-full"
				/>
				<TrashButton
					onClick={() => {
						const res = removeNote(note.id)
						if (res === undefined)
							toast.error("Failed to delete note")
						else toast.success("Note deleted successfully")
					}}
				/>
			</div>
			<EditorWrapper
				key={note.id}
				noteId={note.id}
				initialValue={note?.content}
				onSave={(noteId, content) =>
					saveNoteChange(noteId, {
						id: noteId,
						content,
					})
				}
				placeholder="Start typing here..."
			/>
		</div>
	)
}

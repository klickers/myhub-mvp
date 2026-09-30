import { useMemo } from "react"
import { Plate, createPlateEditor } from "platejs/react"
import { Editor, EditorContainer } from "@/components/editor/ui/editor"
import { EditorKit } from "@/components/editor/editor-kit"
import { type Value } from "platejs"
import debounce from "@/helpers/debounce"
import type { Prisma } from "@/generated/prisma/browser"

export default function EditorWrapper({
	noteId,
	initialValue,
	placeholder,
	onSave,
}: {
	noteId: number
	initialValue: any
	placeholder?: string
	onSave: (noteId: number, content: Prisma.JsonArray) => void
}) {
	const debouncedSave = useMemo(
		() =>
			debounce((value: Prisma.JsonArray) => {
				onSave(noteId, value)
			}, 500),
		[noteId, onSave],
	)

	const editor = useMemo(
		() =>
			createPlateEditor({
				plugins: EditorKit,
				value: initialValue as Value,
			}),
		[],
	)

	return (
		<Plate
			editor={editor}
			onValueChange={({ value }) =>
				debouncedSave(value as Prisma.JsonArray)
			}
		>
			<EditorContainer className="editor">
				<Editor placeholder={placeholder || "Start typing here..."} />
			</EditorContainer>
		</Plate>
	)
}

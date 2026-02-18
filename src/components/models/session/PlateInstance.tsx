import type { Prisma } from "@/generated/prisma/client"
import { Plate, usePlateEditor } from "platejs/react"
import { EditorKit } from "@/components/editor/editor-kit"
import type { Value } from "platejs"
import { Editor, EditorContainer } from "@/components/editor/ui/editor"

interface Props {
	value: Prisma.JsonArray
}

const PlateInstance: React.FC<Props> = ({ value }) => {
	return (
		<Plate
			onValueChange={({ value }) => {
				// setNotes(
				// 	value as Prisma.JsonArray,
				// )
			}}
			editor={usePlateEditor({
				plugins: EditorKit,
				value: value as Value,
			})}
		>
			<EditorContainer className="editor">
				<Editor placeholder="(No notes)" />
			</EditorContainer>
		</Plate>
	)
}

export default PlateInstance

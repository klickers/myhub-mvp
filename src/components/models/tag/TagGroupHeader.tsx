import { useState } from "react"
import { Icon } from "@iconify/react"
import TagGroup from "@/components/models/tag/TagGroup"
import TagCreateForm from "@/components/models/tag/CreateTagForm"
import type { TagWithChildren } from "@/types/prisma-custom"
import type { Tag } from "@/generated/prisma/client"

export default function TagGroupHeader({
	initialGroups,
}: {
	initialGroups: (Tag | TagWithChildren)[]
}) {
	const [showInput, setShowInput] = useState(false)
	const [groups, setGroups] =
		useState<(Tag | TagWithChildren)[]>(initialGroups)

	return (
		<>
			<div className="flex items-center justify-between gap-3 w-full mb-2">
				<p className="uppercase font-semibold flex items-center gap-1 mb-0">
					Groups
				</p>
				<button onClick={() => setShowInput(!showInput)}>
					{showInput ? (
						<Icon icon="mingcute:minus-circle-fill" />
					) : (
						<Icon icon="mingcute:add-circle-fill" />
					)}
				</button>
			</div>

			{showInput && (
				<TagCreateForm
					type="group"
					successMessage={(name) =>
						`Tag group ${name} created successfully!`
					}
					onCreated={(group) =>
						setGroups((groups) => [...groups, group])
					}
					onClose={() => setShowInput(false)}
				/>
			)}

			<div>
				{groups.map((group) => (
					<TagGroup
						group={group}
						key={group.id}
					/>
				))}
			</div>
		</>
	)
}

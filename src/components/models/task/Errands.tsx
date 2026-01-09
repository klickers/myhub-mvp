import { useCallback, useEffect, useState } from "react"
import { actions } from "astro:actions"
import EditableStatus from "@/components/form/EditableStatus"
import EditableNumber from "@/components/form/EditableNumber"
import EditableText from "@/components/form/EditableText"
import SessionPlayButton from "@/components/models/session/SessionPlayButton"
import AddErrand from "./AddErrand"
import type { Task } from "@/generated/prisma/client"

export default function Errands() {
	const [errands, setErrands] = useState<Task[]>([])
	const [loading, setLoading] = useState(false)

	const reload = useCallback(async () => {
		setLoading(true)
		const res = await actions.task.listErrands({})
		setErrands(res.data ?? [])
		setLoading(false)
	}, [])

	useEffect(() => {
		void reload()
	}, [reload])

	return (
		<div className="space-y-2">
			<div className="flex justify-between items-center">
				{loading ? (
					<span className="text-sm text-gray-500">"Loading…"</span>
				) : (
					<p className="font-semibold mb-0">Errands</p>
				)}
				<AddErrand onAdded={reload} />
			</div>

			<div className="space-y-2">
				{errands.map((errand) => (
					<div
						key={errand.id}
						className="flex items-center gap-3 text-sm"
					>
						<EditableText
							value={errand.name}
							onSave={(name) =>
								actions.task
									.update({ id: errand.id, name })
									.then(reload)
							}
						/>
						<EditableStatus
							value={errand.status}
							onSave={(status) =>
								actions.task
									.update({ id: errand.id, status })
									.then(reload)
							}
						/>
						{/* <EditableNumber
							value={errand.estimatedTime}
							onSave={(v) =>
								actions.task
									.update({
										id: errand.id,
										estimatedTime: v ?? undefined,
									})
									.then(reload)
							}
						/> */}
						<SessionPlayButton
							itemType="task"
							itemId={errand.id}
						/>
					</div>
				))}
			</div>
		</div>
	)
}

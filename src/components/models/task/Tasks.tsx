import type { TaskNode } from "@/helpers/buildTaskTree"
import Task from "@/components/models/task/Task"
import type { TagWithChildren } from "@/types/prisma-custom"

interface Props {
	tasks: TaskNode[]
	tags: TagWithChildren[]
	currentTag?: TagWithChildren | null
}

export default function Tasks({ tasks, tags, currentTag }: Props) {
	return (
		<table>
			<thead>
				<tr>
					<th>Task</th>
					<th>Status</th>
					<th>Est. Time</th>
					<th>Deadline</th>
					<th>Tags</th>
					{/* Controls */}
					<th></th>
				</tr>
			</thead>
			<tbody>
				<Task
					initialTasks={tasks}
					depth={0}
					tags={tags}
					currentTag={currentTag}
				/>
			</tbody>
		</table>
	)
}

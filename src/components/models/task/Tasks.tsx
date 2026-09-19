import type { TaskNode } from "@/helpers/buildTaskTree"
import Task from "@/components/models/task/Task"
import type { TagWithChildren } from "@/types/prisma-custom"

interface Props {
	tasks: TaskNode[]
	tags: TagWithChildren[]
}

export default function Tasks({ tasks, tags }: Props) {
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
				/>
			</tbody>
		</table>
	)
}

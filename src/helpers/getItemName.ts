export default function getItemName(parentTask: { name: string } | null) {
	let name = null
	if (parentTask) name = parentTask.name
	return name
}

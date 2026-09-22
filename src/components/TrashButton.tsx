import { Icon } from "@iconify/react"

interface Props {
	className?: string
	onClick?: () => void
}

export default function TrashButton({ className, onClick }: Props) {
	return (
		<button
			className={["text-red-300 hover:text-red-500", className]
				.filter(Boolean)
				.join(" ")}
			onClick={onClick}
		>
			<Icon icon="mingcute:delete-2-fill" />
		</button>
	)
}

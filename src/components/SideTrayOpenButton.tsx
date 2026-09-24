import { Icon } from "@iconify/react"

interface Props {
	className?: string
	onClick?: () => void
}

export default function SideTrayOpenButton({ className, onClick }: Props) {
	return (
		<button
			className={["", className].filter(Boolean).join(" ")}
			onClick={onClick ?? (() => {})}
		>
			<Icon icon="mingcute:external-link-line" />
		</button>
	)
}

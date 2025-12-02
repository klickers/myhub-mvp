import { Icon } from "@iconify/react"

interface TopNavigationProps {
	currentPath: string
}

const links = [{ href: "/", label: "Home", icon: "pixelarticons:home" }]

export default function TopNavigation({ currentPath }: TopNavigationProps) {
	return (
		<nav className="px-6 py-3 border-b border-black flex gap-3 fixed top-0 w-full bg-white">
			{links.map(({ href, label, icon }) => (
				<a
					href={href}
					className={
						"text-sm font-semibold uppercase flex gap-1 px-2 pt-2 pb-1" +
						(currentPath === href ? " bg-gray-200" : "")
					}
				>
					<Icon icon={icon} />
					<span className="-mt-0.5">{label}</span>
				</a>
			))}
		</nav>
	)
}

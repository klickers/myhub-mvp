import { playingSession } from "@/stores/playingSession"
import { actions } from "astro:actions"

async function getTitleAndSlug(
	itemType: string,
	itemId: number
): Promise<{ title: string | null; slug: string | null }> {
	if (!itemId) return { title: null, slug: null }

	switch (itemType) {
		case "objective": {
			const objective = await actions.getObjectiveById({ id: itemId })
			return {
				title: objective.data?.name ?? null,
				slug: objective.data?.slug ?? null,
			}
		}

		case "guild": {
			const guild = await actions.guild.getById({ id: itemId })
			return {
				title: guild.data?.name ?? null,
				slug: guild.data?.slug ?? null,
			}
		}

		case "contract": {
			const contract = await actions.contract.getById({ id: itemId })
			return {
				title: contract.data?.name ?? null,
				slug: contract.data?.slug ?? null,
			}
		}

		default:
			return { title: null, slug: null }
	}
}

export const initPlayingSession = async () => {
	const current = playingSession.get()
	if (current._initialized) return

	const id = await actions.getKeyValue.orThrow({
			key: "playingSessionId",
		}),
		isPlaying = await actions.getKeyValue.orThrow({
			key: "isSessionPlaying",
		}),
		itemType = await actions.getKeyValue.orThrow({
			key: "playingSessionItemType",
		}),
		itemId = await actions.getKeyValue.orThrow({
			key: "playingSessionItemId",
		}),
		startTime = await actions.getKeyValue.orThrow({
			key: "playingSessionStartTime",
		})
	const parsedItemId = parseInt(itemId || "0")
	const { title, slug } = await getTitleAndSlug(itemType, parsedItemId)

	playingSession.set({
		id: parseInt(id || "0"),
		isPlaying: isPlaying === "true",
		itemType,
		itemId: parsedItemId,
		startTime: startTime ? new Date(startTime) : null,
		title,
		slug,
		_initialized: true,
	})
}

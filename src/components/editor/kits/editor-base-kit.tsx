import { BaseAlignKit } from "@/components/editor/kits/align-base-kit"
import { BaseBasicBlocksKit } from "@/components/editor/kits/basic-blocks-base-kit"
import { BaseBasicMarksKit } from "@/components/editor/kits/basic-marks-base-kit"
import { BaseCalloutKit } from "@/components/editor/kits/callout-base-kit"
import { BaseCodeBlockKit } from "@/components/editor/kits/code-block-base-kit"
import { BaseColumnKit } from "@/components/editor/kits/column-base-kit"
import { BaseCommentKit } from "@/components/editor/kits/comment-base-kit"
import { BaseDateKit } from "@/components/editor/kits/date-base-kit"
import { BaseFontKit } from "@/components/editor/kits/font-base-kit"
import { BaseLineHeightKit } from "@/components/editor/kits/line-height-base-kit"
import { BaseLinkKit } from "@/components/editor/kits/link-base-kit"
import { BaseListKit } from "@/components/editor/kits/list-base-kit"
import { MarkdownKit } from "@/components/editor/kits/markdown-kit"
import { BaseMathKit } from "@/components/editor/kits/math-base-kit"
import { BaseMediaKit } from "@/components/editor/kits/media-base-kit"
import { BaseMentionKit } from "@/components/editor/kits/mention-base-kit"
import { BaseSuggestionKit } from "@/components/editor/kits/suggestion-base-kit"
import { BaseTableKit } from "@/components/editor/kits/table-base-kit"
import { BaseTocKit } from "@/components/editor/kits/toc-base-kit"
import { BaseToggleKit } from "@/components/editor/kits/toggle-base-kit"

export const BaseEditorKit = [
	...BaseBasicBlocksKit,
	...BaseCodeBlockKit,
	...BaseTableKit,
	...BaseToggleKit,
	...BaseTocKit,
	...BaseMediaKit,
	...BaseCalloutKit,
	...BaseColumnKit,
	...BaseMathKit,
	...BaseDateKit,
	...BaseLinkKit,
	...BaseMentionKit,
	...BaseBasicMarksKit,
	...BaseFontKit,
	...BaseListKit,
	...BaseAlignKit,
	...BaseLineHeightKit,
	...BaseCommentKit,
	...BaseSuggestionKit,
	...MarkdownKit,
]

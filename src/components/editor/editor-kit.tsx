"use client"

import { type Value, TrailingBlockPlugin } from "platejs"
import { type TPlateEditor, useEditorRef } from "platejs/react"

import { AIKit } from "@/components/editor/kits/ai-kit"
import { AlignKit } from "@/components/editor/kits/align-kit"
import { AutoformatKit } from "@/components/editor/kits/autoformat-kit"
import { BasicBlocksKit } from "@/components/editor/kits/basic-blocks-kit"
import { BasicMarksKit } from "@/components/editor/kits/basic-marks-kit"
import { BlockMenuKit } from "@/components/editor/kits/block-menu-kit"
import { BlockPlaceholderKit } from "@/components/editor/kits/block-placeholder-kit"
import { CalloutKit } from "@/components/editor/kits/callout-kit"
import { CodeBlockKit } from "@/components/editor/kits/code-block-kit"
import { ColumnKit } from "@/components/editor/kits/column-kit"
import { CommentKit } from "@/components/editor/kits/comment-kit"
import { CursorOverlayKit } from "@/components/editor/kits/cursor-overlay-kit"
import { DateKit } from "@/components/editor/kits/date-kit"
import { DiscussionKit } from "@/components/editor/kits/discussion-kit"
import { DndKit } from "@/components/editor/kits/dnd-kit"
import { DocxKit } from "@/components/editor/kits/docx-kit"
import { EmojiKit } from "@/components/editor/kits/emoji-kit"
import { ExitBreakKit } from "@/components/editor/kits/exit-break-kit"
import { FixedToolbarKit } from "@/components/editor/kits/fixed-toolbar-kit"
import { FloatingToolbarKit } from "@/components/editor/kits/floating-toolbar-kit"
import { FontKit } from "@/components/editor/kits/font-kit"
import { LineHeightKit } from "@/components/editor/kits/line-height-kit"
import { LinkKit } from "@/components/editor/kits/link-kit"
import { ListKit } from "@/components/editor/kits/list-kit"
import { MarkdownKit } from "@/components/editor/kits/markdown-kit"
import { MathKit } from "@/components/editor/kits/math-kit"
import { MediaKit } from "@/components/editor/kits/media-kit"
import { MentionKit } from "@/components/editor/kits/mention-kit"
import { SlashKit } from "@/components/editor/kits/slash-kit"
import { SuggestionKit } from "@/components/editor/kits/suggestion-kit"
import { TableKit } from "@/components/editor/kits/table-kit"
import { TocKit } from "@/components/editor/kits/toc-kit"
import { ToggleKit } from "@/components/editor/kits/toggle-kit"

export const EditorKit = [
	...AIKit,
	...BlockMenuKit,

	// Elements
	...BasicBlocksKit,
	...CodeBlockKit,
	...TableKit,
	...ToggleKit,
	...TocKit,
	...MediaKit,
	...CalloutKit,
	...ColumnKit,
	...MathKit,
	...DateKit,
	...LinkKit,
	...MentionKit,

	// Marks
	...BasicMarksKit,
	...FontKit,

	// Block Style
	...ListKit,
	...AlignKit,
	...LineHeightKit,

	// Collaboration
	...DiscussionKit,
	...CommentKit,
	...SuggestionKit,

	// Editing
	...SlashKit,
	...AutoformatKit,
	...CursorOverlayKit,
	...DndKit,
	...EmojiKit,
	...ExitBreakKit,
	TrailingBlockPlugin,

	// Parsers
	...DocxKit,
	...MarkdownKit,

	// UI
	...BlockPlaceholderKit,
	...FixedToolbarKit,
	...FloatingToolbarKit,
]

export type MyEditor = TPlateEditor<Value, (typeof EditorKit)[number]>

export const useEditor = () => useEditorRef<MyEditor>()

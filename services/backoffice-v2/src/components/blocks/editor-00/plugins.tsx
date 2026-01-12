import ClickableLinkPlugin from "@lexical/react/LexicalClickableLinkPlugin"
import LexicalErrorBoundary from "@lexical/react/LexicalErrorBoundary"
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin"
import { useState } from "react"

import { ContentEditable } from "@/components/editor/editor-ui/content-editable"
import { AutoLinkPlugin } from "@/components/editor/plugins/auto-link-plugin"
import {FloatingLinkEditorPlugin} from "@/components/editor/plugins/floating-link-editor-plugin.tsx";
import {LinkPlugin} from "@/components/editor/plugins/link-plugin.tsx";
import { FormatBulletedList } from "@/components/editor/plugins/toolbar/block-format/format-bulleted-list"
import {FormatCheckList} from '@/components/editor/plugins/toolbar/block-format/format-check-list';
import { FormatHeading } from "@/components/editor/plugins/toolbar/block-format/format-heading"
import {FormatNumberedList} from '@/components/editor/plugins/toolbar/block-format/format-numbered-list';
import {FormatParagraph} from '@/components/editor/plugins/toolbar/block-format/format-paragraph';
import { FormatQuote } from "@/components/editor/plugins/toolbar/block-format/format-quote"
import { BlockFormatDropDown } from "@/components/editor/plugins/toolbar/block-format-toolbar-plugin"
import {ElementFormatToolbarPlugin} from "@/components/editor/plugins/toolbar/element-format-toolbar-plugin";
import {FontBackgroundToolbarPlugin} from "@/components/editor/plugins/toolbar/font-background-toolbar-plugin";
import {FontColorToolbarPlugin} from "@/components/editor/plugins/toolbar/font-color-toolbar-plugin";
import {FontFormatToolbarPlugin} from "@/components/editor/plugins/toolbar/font-format-toolbar-plugin";
import { LinkToolbarPlugin } from "@/components/editor/plugins/toolbar/link-toolbar-plugin"
import { ToolbarPlugin } from "@/components/editor/plugins/toolbar/toolbar-plugin"

export function Plugins() {
    const [floatingAnchorElem, setFloatingAnchorElem] =
    useState<HTMLDivElement | null>(null)
    const [isLinkEditMode, setIsLinkEditMode] = useState<boolean>(false)

  const onRef = (_floatingAnchorElem: HTMLDivElement) => {
    if (_floatingAnchorElem !== null) {
      setFloatingAnchorElem(_floatingAnchorElem)
    }
  }

    return (
    <div className="relative">
        <ToolbarPlugin>
            {() => (
                <div className="vertical-align-middle sticky top-0 z-10 flex gap-2 overflow-auto border-b p-1">
                    <BlockFormatDropDown>
                        <FormatParagraph />
                        <FormatHeading levels={["h1", "h2", "h3"]} />
                        <FormatNumberedList />
                        <FormatBulletedList />
                        <FormatCheckList />
                        <FormatQuote />
                    </BlockFormatDropDown>
                    <ElementFormatToolbarPlugin />
                    <FontColorToolbarPlugin />
                    <FontBackgroundToolbarPlugin />
                    <FontFormatToolbarPlugin />
                    <LinkToolbarPlugin setIsLinkEditMode={setIsLinkEditMode} />
                </div>
            )}
        </ToolbarPlugin>
      <div className="relative">
        <RichTextPlugin
          placeholder=""
          contentEditable={
            <div className="">
              <div className="" ref={onRef}>
                <ContentEditable placeholder="Start typing ..." />
              </div>
            </div>
          }
          ErrorBoundary={LexicalErrorBoundary}
        />
      <ClickableLinkPlugin />
      <AutoLinkPlugin />
      <LinkPlugin />
      <FloatingLinkEditorPlugin
          anchorElem={floatingAnchorElem}
          isLinkEditMode={isLinkEditMode}
          setIsLinkEditMode={setIsLinkEditMode}
      />
        {/* editor plugins */}
      </div>
      {/* actions plugins */}
    </div>
  )
}

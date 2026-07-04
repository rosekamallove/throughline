"use client";

import { BoldIcon, ItalicIcon, UnderlineIcon } from "lucide-react";
import { KEYS, type Value } from "platejs";
import { Plate, usePlateEditor } from "platejs/react";

import { BasicNodesKit } from "@/components/editor/plugins/basic-nodes-kit";
import { Editor, EditorContainer } from "@/components/ui/editor";
import { FloatingToolbar } from "@/components/ui/floating-toolbar";
import { MarkToolbarButton } from "@/components/ui/mark-toolbar-button";
import { cn } from "@/lib/utils";

/** Research-page Plate editor. Uncontrolled after mount, like BeatEditor.
 *  Compact (sidebar) mode skips the floating toolbar — the rail's scroll
 *  container would clip it; mark shortcuts (mod+b…) still work. */
export function DocEditor({
  initialValue,
  placeholder,
  compact = false,
  onChange,
}: {
  initialValue: Value;
  placeholder?: string;
  compact?: boolean;
  onChange: (value: Value) => void;
}) {
  const editor = usePlateEditor({ plugins: BasicNodesKit, value: initialValue });

  return (
    <Plate editor={editor} onChange={({ value }) => onChange(value)}>
      <EditorContainer variant="default" className="overflow-visible!">
        <Editor
          variant="none"
          placeholder={placeholder}
          className={cn(
            "text-foreground/90",
            compact ? "text-[13px] leading-relaxed" : "text-[15px] leading-[1.75]",
          )}
        />
        {!compact && (
          <FloatingToolbar>
            <MarkToolbarButton nodeType={KEYS.bold} tooltip="Bold">
              <BoldIcon />
            </MarkToolbarButton>
            <MarkToolbarButton nodeType={KEYS.italic} tooltip="Italic">
              <ItalicIcon />
            </MarkToolbarButton>
            <MarkToolbarButton nodeType={KEYS.underline} tooltip="Underline">
              <UnderlineIcon />
            </MarkToolbarButton>
          </FloatingToolbar>
        )}
      </EditorContainer>
    </Plate>
  );
}

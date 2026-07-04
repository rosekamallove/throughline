"use client";

import { BoldIcon, Clapperboard, ItalicIcon, UnderlineIcon } from "lucide-react";
import { KEYS, NodeApi, type Value } from "platejs";
import { Plate, useEditorRef, usePlateEditor } from "platejs/react";

import { BasicNodesKit } from "@/components/editor/plugins/basic-nodes-kit";
import { Editor, EditorContainer } from "@/components/ui/editor";
import { FloatingToolbar } from "@/components/ui/floating-toolbar";
import { MarkToolbarButton } from "@/components/ui/mark-toolbar-button";
import { ToolbarButton } from "@/components/ui/toolbar";

function AddShotButton({ onAddShot }: { onAddShot?: (text: string) => void }) {
  const editor = useEditorRef();
  if (!onAddShot) return null;
  return (
    <ToolbarButton
      tooltip="Add selection as a shot idea"
      onClick={() => {
        const selected = editor.selection
          ? editor.api.string(editor.selection).trim()
          : "";
        if (selected) onAddShot(selected);
      }}
    >
      <Clapperboard /> Shot
    </ToolbarButton>
  );
}

/** Per-beat Plate editor. Uncontrolled after mount — local editor state is
 *  the source of truth while typing; changes flow up for stats + autosave. */
export function BeatEditor({
  initialValue,
  placeholder,
  onChange,
  onAddShot,
}: {
  initialValue: Value;
  placeholder?: string;
  onChange: (payload: { value: Value; text: string }) => void;
  onAddShot?: (text: string) => void;
}) {
  const editor = usePlateEditor({ plugins: BasicNodesKit, value: initialValue });

  return (
    <Plate
      editor={editor}
      onChange={({ value }) => {
        const text = value.map((node) => NodeApi.string(node)).join("\n");
        onChange({ value, text });
      }}
    >
      {/* Beat editors are auto-height; the container's default overflow-y-auto
          would clip the floating toolbar on first-line selections. */}
      <EditorContainer variant="default" className="overflow-visible!">
        <Editor
          variant="none"
          placeholder={placeholder}
          className="text-[15px] leading-[1.75] text-foreground/90"
        />
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
          <AddShotButton onAddShot={onAddShot} />
        </FloatingToolbar>
      </EditorContainer>
    </Plate>
  );
}

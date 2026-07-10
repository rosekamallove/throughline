"use client";

import { BoldIcon, Clapperboard, ItalicIcon, UnderlineIcon } from "lucide-react";
import { KEYS, NodeApi, type Value } from "platejs";
import { Plate, useEditorRef, usePlateEditor } from "platejs/react";

import { BasicNodesKit } from "@/components/editor/plugins/basic-nodes-kit";
import { ListKit } from "@/components/editor/plugins/list-kit";
import { ShotKit } from "@/components/editor/plugins/shot-kit";
import { SlashKit } from "@/components/editor/plugins/slash-kit";
import { TableKit } from "@/components/editor/plugins/table-kit";
import { Editor, EditorContainer } from "@/components/ui/editor";
import { FloatingToolbar } from "@/components/ui/floating-toolbar";
import { MarkToolbarButton } from "@/components/ui/mark-toolbar-button";
import { ToolbarButton } from "@/components/ui/toolbar";

function AddShotButton({
  onAddShot,
}: {
  onAddShot?: (text: string, shotId: string) => void;
}) {
  const editor = useEditorRef();
  if (!onAddShot) return null;
  return (
    <ToolbarButton
      tooltip="Add selection as a shot idea"
      onClick={() => {
        const selected = editor.selection
          ? editor.api.string(editor.selection).trim()
          : "";
        if (!selected) return;
        const shotId = crypto.randomUUID();
        // Mark the selected words so the shot stays anchored to the prose,
        // then drop the pending mark so typing at the edge doesn't extend it.
        editor.tf.addMark("shot", shotId);
        editor.tf.collapse({ edge: "end" });
        editor.tf.removeMark("shot");
        onAddShot(selected, shotId);
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
  onAddShot?: (text: string, shotId: string) => void;
}) {
  const editor = usePlateEditor({
    plugins: [...BasicNodesKit, ...ListKit, ...TableKit, ...SlashKit, ...ShotKit],
    value: initialValue,
  });

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

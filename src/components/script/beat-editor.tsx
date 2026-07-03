"use client";

import { NodeApi, type Value } from "platejs";
import { Plate, usePlateEditor } from "platejs/react";

import { BasicNodesKit } from "@/components/editor/plugins/basic-nodes-kit";
import { Editor, EditorContainer } from "@/components/ui/editor";

/** Per-beat Plate editor. Uncontrolled after mount — local editor state is
 *  the source of truth while typing; changes flow up for stats + autosave. */
export function BeatEditor({
  initialValue,
  placeholder,
  onChange,
}: {
  initialValue: Value;
  placeholder?: string;
  onChange: (payload: { value: Value; text: string }) => void;
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
      <EditorContainer variant="default">
        <Editor
          variant="none"
          placeholder={placeholder}
          className="text-[15px] leading-[1.75] text-foreground/90"
        />
      </EditorContainer>
    </Plate>
  );
}

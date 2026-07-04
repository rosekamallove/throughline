"use client";

import { createPlatePlugin, PlateLeaf, type PlateLeafProps } from "platejs/react";

/** Mark carrying a b-roll shot id — ties the highlighted words in the script
 *  to their entry in the shots list. */
export const ShotPlugin = createPlatePlugin({
  key: "shot",
  node: { isLeaf: true },
});

function ShotLeaf(props: PlateLeafProps) {
  return (
    <PlateLeaf
      {...props}
      className="shot-mark"
      attributes={{
        ...props.attributes,
        "data-shot-id": String(props.leaf.shot),
      }}
    >
      {props.children}
    </PlateLeaf>
  );
}

export const ShotKit = [ShotPlugin.withComponent(ShotLeaf)];

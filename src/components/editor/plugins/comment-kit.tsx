"use client";

import { createPlatePlugin, PlateLeaf, type PlateLeafProps } from "platejs/react";

/** Mark carrying a review-comment id — highlights the passage a note hangs off
 *  and ties it to its entry in the comments list. Resolved comments drop the
 *  mark, so only open ones stay highlighted. */
export const CommentPlugin = createPlatePlugin({
  key: "comment",
  node: { isLeaf: true },
});

function CommentLeaf(props: PlateLeafProps) {
  return (
    <PlateLeaf
      {...props}
      className="comment-mark"
      attributes={{
        ...props.attributes,
        "data-comment-id": String(props.leaf.comment),
      }}
    >
      {props.children}
    </PlateLeaf>
  );
}

export const CommentKit = [CommentPlugin.withComponent(CommentLeaf)];

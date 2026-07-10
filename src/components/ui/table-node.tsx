"use client";

import { PlateElement, type PlateElementProps } from "platejs/react";

import { cn } from "@/lib/utils";

/** Minimal table renderers — valid table > tbody > tr > td/th structure with
 *  plain borders. No column resizing or cell selection UI (kept lean); rows and
 *  columns are added via the slash-inserted grid and Tab/Enter navigation. */
export function TableElement(props: PlateElementProps) {
  return (
    <PlateElement
      {...props}
      as="table"
      className={cn(
        "my-4 w-full table-fixed border-collapse overflow-hidden rounded-lg text-[14px]",
        props.className,
      )}
    >
      <tbody className="min-w-full">{props.children}</tbody>
    </PlateElement>
  );
}

export function TableRowElement(props: PlateElementProps) {
  return <PlateElement {...props} as="tr" />;
}

export function TableCellElement(props: PlateElementProps) {
  return (
    <PlateElement
      {...props}
      as="td"
      className={cn(
        "border border-border px-3 py-1.5 align-top [&>*]:my-0",
        props.className,
      )}
    />
  );
}

export function TableCellHeaderElement(props: PlateElementProps) {
  return (
    <PlateElement
      {...props}
      as="th"
      className={cn(
        "border border-border bg-muted/50 px-3 py-1.5 text-left align-top font-semibold [&>*]:my-0",
        props.className,
      )}
    />
  );
}

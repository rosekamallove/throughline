"use client";

import { ImageUp, Plus, SquarePlay, Type, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { ThumbnailPackaging } from "@/components/video/thumbnail-packaging";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fileToThumbUrl } from "@/lib/image";
import { cn } from "@/lib/utils";
import { youtubeIdFromUrl } from "@/lib/youtube";
import type { PackagingVariant } from "@/trpc/types";

const TAGS = ["A", "B", "C", "D", "E", "F", "G", "H"];

export type NewThumbnail =
  | { imageUrl: string }
  | { color: string; lines: string[] };

export function ThumbnailOptions({
  variants,
  onSelect,
  onDelete,
  onCreate,
}: {
  variants: PackagingVariant[];
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onCreate: (input: NewThumbnail) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {variants.map((v, i) => (
        <div key={v.id} className="group relative flex flex-col gap-1.5">
          <button onClick={() => onSelect(v.id)} className="text-left">
            <ThumbnailPackaging
              color={v.color}
              lines={v.thumbText}
              imageUrl={v.imageUrl}
              className={cn(
                "transition-shadow",
                v.isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-background",
              )}
            />
          </button>
          <span className="font-mono text-[11px] text-muted-foreground">
            {TAGS[i] ?? "·"}
            {v.estCtr != null && ` · ${v.estCtr}% CTR`}
            {v.isSelected && " · selected"}
          </span>
          {!v.isSelected && (
            <button
              aria-label="Delete option"
              onClick={() => onDelete(v.id)}
              className="absolute right-1.5 top-1.5 rounded-full bg-black/60 p-1 opacity-0 transition-opacity hover:bg-black/80 group-hover:opacity-100"
            >
              <X className="size-3 text-white" />
            </button>
          )}
        </div>
      ))}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <button className="flex aspect-video flex-col items-center justify-center gap-1.5 rounded-thumb border border-dashed text-muted-foreground transition-colors hover:border-ring hover:text-foreground">
            <Plus className="size-5" />
            <span className="text-[12px]">Add thumbnail</span>
          </button>
        </DialogTrigger>
        <AddThumbnailDialogContent
          onCreate={(input) => {
            onCreate(input);
            setOpen(false);
          }}
        />
      </Dialog>
    </div>
  );
}

function AddThumbnailDialogContent({ onCreate }: { onCreate: (input: NewThumbnail) => void }) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [color, setColor] = useState("#CE2E6C");
  const [lines, setLines] = useState(["", "", ""]);
  const [ytUrl, setYtUrl] = useState("");
  const [ytPreview, setYtPreview] = useState<string | null>(null);
  const [ytBusy, setYtBusy] = useState(false);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    try {
      setPreview(await fileToThumbUrl(file));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't read that image");
    } finally {
      setBusy(false);
    }
  }

  async function resolveYouTube() {
    const id = youtubeIdFromUrl(ytUrl);
    if (!id) {
      toast.error("That doesn't look like a YouTube URL");
      return;
    }
    setYtBusy(true);
    // maxresdefault is 1280×720 but only exists for HD uploads; fall back to
    // mqdefault (320×180, always present, still 16:9) when it's missing.
    const maxres = `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`;
    const mq = `https://i.ytimg.com/vi/${id}/mqdefault.jpg`;
    const url = await new Promise<string>((resolve) => {
      const img = new window.Image();
      img.onload = () => resolve(img.naturalWidth > 320 ? maxres : mq);
      img.onerror = () => resolve(mq);
      img.src = maxres;
    });
    setYtPreview(url);
    setYtBusy(false);
  }

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>New thumbnail</DialogTitle>
        <DialogDescription>
          1280×720, 16:9, same requirements as YouTube. Images are cropped to fit.
        </DialogDescription>
      </DialogHeader>

      <Tabs defaultValue="upload">
        <TabsList className="w-full">
          <TabsTrigger value="upload" className="flex-1 gap-1.5">
            <ImageUp className="size-3.5" /> Upload
          </TabsTrigger>
          <TabsTrigger value="youtube" className="flex-1 gap-1.5">
            <SquarePlay className="size-3.5" /> YouTube
          </TabsTrigger>
          <TabsTrigger value="text" className="flex-1 gap-1.5">
            <Type className="size-3.5" /> Text
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="mt-4">
          <input
            ref={fileInput}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={(e) => void handleFile(e.target.files?.[0])}
          />
          {preview ? (
            <div className="flex flex-col gap-3">
              <ThumbnailPackaging imageUrl={preview} alt="Thumbnail preview" />
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => fileInput.current?.click()}>
                  Choose another
                </Button>
                <Button className="flex-1" onClick={() => onCreate({ imageUrl: preview })}>
                  Add thumbnail
                </Button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => fileInput.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                void handleFile(e.dataTransfer.files?.[0]);
              }}
              className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-thumb border-2 border-dashed text-muted-foreground transition-colors hover:border-ring hover:text-foreground"
            >
              <ImageUp className="size-7" />
              <span className="text-sm font-medium">
                {busy ? "Processing…" : "Drop an image or click to browse"}
              </span>
              <span className="text-[12px]">JPG · PNG · WebP · at least 640px wide</span>
            </button>
          )}
        </TabsContent>

        <TabsContent value="youtube" className="mt-4">
          {ytPreview ? (
            <div className="flex flex-col gap-3">
              <ThumbnailPackaging imageUrl={ytPreview} alt="YouTube thumbnail" />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setYtPreview(null);
                    setYtUrl("");
                  }}
                >
                  Use another
                </Button>
                <Button className="flex-1" onClick={() => onCreate({ imageUrl: ytPreview })}>
                  Add thumbnail
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex gap-2">
                <Input
                  value={ytUrl}
                  onChange={(e) => setYtUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !ytBusy && void resolveYouTube()}
                  placeholder="Paste a YouTube video URL…"
                  autoFocus
                />
                <Button
                  variant="secondary"
                  disabled={!ytUrl.trim() || ytBusy}
                  onClick={() => void resolveYouTube()}
                >
                  {ytBusy ? "Fetching…" : "Fetch"}
                </Button>
              </div>
              <p className="text-[12px] text-muted-foreground">
                Pulls the video&rsquo;s thumbnail straight from YouTube — a fast way to
                drop a reference next to your own options. No download needed.
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="text" className="mt-4">
          <div className="flex flex-col gap-3">
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <Label htmlFor="thumb-color" className="mb-1.5 block">
                  Background
                </Label>
                <Input
                  id="thumb-color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  placeholder="#CE2E6C"
                />
              </div>
              <ThumbnailPackaging
                color={color}
                lines={lines.filter((l) => l.trim())}
                className="w-28 shrink-0"
              />
            </div>
            {lines.map((line, i) => (
              <Input
                key={i}
                value={line}
                onChange={(e) => setLines((ls) => ls.map((l, j) => (j === i ? e.target.value : l)))}
                placeholder={`Line ${i + 1}${i === 2 ? " (*word* to highlight)" : ""}`}
              />
            ))}
            <DialogFooter>
              <Button
                onClick={() => {
                  const filled = lines.map((l) => l.trim()).filter(Boolean);
                  if (!filled.length) return;
                  onCreate({ color, lines: filled });
                }}
              >
                Add placeholder
              </Button>
            </DialogFooter>
          </div>
        </TabsContent>
      </Tabs>
    </DialogContent>
  );
}

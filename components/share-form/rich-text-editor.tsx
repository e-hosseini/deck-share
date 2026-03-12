"use client";

import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Quote,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Minus,
  CodeSquare,
  Link as LinkIcon,
  Video,
  Type,
  FileCode,
} from "lucide-react";
import { EmbedExtension } from "@/components/share-form/embed-extension";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const linkExtension = Link.configure({
  openOnClick: false,
  HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
});

/** Convert YouTube URL to embed iframe HTML */
function youtubeToEmbedHtml(url: string): string | null {
  const trimmed = url.trim();
  try {
    const u = new URL(trimmed);
    if (u.hostname.includes("youtu.be")) {
      const id = u.pathname.slice(1).split("/")[0];
      if (id) return `<iframe width="560" height="315" src="https://www.youtube.com/embed/${id}" title="YouTube video" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`;
    }
    if (/youtube\.com$/i.test(u.hostname)) {
      const v = u.searchParams.get("v");
      if (v) return `<iframe width="560" height="315" src="https://www.youtube.com/embed/${v}" title="YouTube video" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`;
      const embedMatch = u.pathname.match(/^\/embed\/([^/]+)/);
      if (embedMatch) return `<iframe width="560" height="315" src="https://www.youtube.com/embed/${embedMatch[1]}" title="YouTube video" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`;
    }
  } catch {
    // ignore
  }
  return null;
}

/** Expand editor embed blocks to raw HTML so stored content has actual iframes */
function expandEmbedBlocks(html: string): string {
  if (typeof document === "undefined") return html;
  const div = document.createElement("div");
  div.innerHTML = html;
  div.querySelectorAll(".embed-block").forEach((el) => {
    const dataHtml = el.getAttribute("data-html");
    if (dataHtml) {
      const wrap = document.createElement("div");
      wrap.innerHTML = dataHtml;
      el.replaceWith(...Array.from(wrap.childNodes));
    }
  });
  return div.innerHTML;
}

type ViewMode = "editor" | "code";

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Write something…",
  className,
}: {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const [mode, setMode] = useState<ViewMode>("editor");
  const [codeValue, setCodeValue] = useState(value);

  useEffect(() => {
    if (mode === "code") setCodeValue(value);
  }, [value, mode]);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      linkExtension,
      EmbedExtension,
    ],
    content: value || "",
    editorProps: {
      attributes: {
        class:
          "prose prose-sm dark:prose-invert max-w-none min-h-[35vh] px-3 py-2 focus:outline-none [&_.tiptap]:min-h-[35vh]",
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    if (value !== editor.getHTML()) {
      editor.commands.setContent(value || "", { emitUpdate: false });
    }
  }, [value, editor]);

  const onUpdate = useCallback(() => {
    if (editor) onChange(expandEmbedBlocks(editor.getHTML()));
  }, [editor, onChange]);

  useEffect(() => {
    if (!editor) return;
    editor.on("update", onUpdate);
    return () => {
      editor.off("update", onUpdate);
    };
  }, [editor, onUpdate]);

  const switchToCode = useCallback(() => {
    if (editor) setCodeValue(expandEmbedBlocks(editor.getHTML()));
    setMode("code");
  }, [editor]);

  const switchToEditor = useCallback(() => {
    if (editor) {
      editor.commands.setContent(codeValue || "", { emitUpdate: false });
      onChange(codeValue);
    }
    setMode("editor");
  }, [editor, codeValue, onChange]);

  if (!editor) return null;

  return (
    <div
      className={cn(
        "rounded-md border border-input bg-background text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
        className
      )}
    >
      <EditorToolbar
        editor={editor}
        mode={mode}
        onSwitchToCode={switchToCode}
        onSwitchToEditor={switchToEditor}
      />
      {mode === "code" ? (
        <Textarea
          value={codeValue}
          onChange={(e) => {
            const v = e.target.value;
            setCodeValue(v);
            onChange(v);
          }}
          placeholder={placeholder}
          className={cn(
            "min-h-[35vh] w-full resize-y rounded-none border-0 border-t border-input bg-transparent px-3 py-2 font-mono text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
          )}
          spellCheck={false}
        />
      ) : (
        <EditorContent editor={editor} />
      )}
    </div>
  );
}

function EditorToolbar({
  editor,
  mode,
  onSwitchToCode,
  onSwitchToEditor,
}: {
  editor: Editor;
  mode: ViewMode;
  onSwitchToCode: () => void;
  onSwitchToEditor: () => void;
}) {
  const [embedOpen, setEmbedOpen] = useState(false);
  const [embedInput, setEmbedInput] = useState("");
  const setLink = useCallback(() => {
    const previous = editor.getAttributes("link").href;
    const url = window.prompt("URL", previous ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  const insertEmbed = useCallback(() => {
    const raw = embedInput.trim();
    if (!raw) return;
    const yt = youtubeToEmbedHtml(raw);
    const html = yt ?? raw;
    editor.chain().focus().insertContent({ type: "embed", attrs: { html } }).run();
    setEmbedInput("");
    setEmbedOpen(false);
  }, [editor, embedInput]);

  const btn = "rounded p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground";
  const btnActive = "bg-muted text-foreground";

  return (
    <>
      <div className="flex flex-wrap items-center gap-0.5 border-b border-input p-1">
      <button
        type="button"
        onClick={onSwitchToEditor}
        className={cn(btn, "gap-1.5", mode === "editor" && btnActive)}
        title="Visual editor"
      >
        <Type className="size-4" />
        <span className="text-xs">Editor</span>
      </button>
      <button
        type="button"
        onClick={onSwitchToCode}
        className={cn(btn, "gap-1.5", mode === "code" && btnActive)}
        title="HTML code"
      >
        <FileCode className="size-4" />
        <span className="text-xs">Code</span>
      </button>
      <span className="mx-1 w-px h-5 bg-border" aria-hidden />
      {mode === "editor" && (
        <>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={cn(btn, editor.isActive("heading", { level: 1 }) && btnActive)}
        title="Heading 1"
      >
        <Heading1 className="size-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={cn(btn, editor.isActive("heading", { level: 2 }) && btnActive)}
        title="Heading 2"
      >
        <Heading2 className="size-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={cn(btn, editor.isActive("heading", { level: 3 }) && btnActive)}
        title="Heading 3"
      >
        <Heading3 className="size-4" />
      </button>
      <span className="mx-1 w-px h-5 bg-border" aria-hidden />
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={cn(btn, editor.isActive("bold") && btnActive)}
        title="Bold (Ctrl+B)"
      >
        <Bold className="size-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={cn(btn, editor.isActive("italic") && btnActive)}
        title="Italic (Ctrl+I)"
      >
        <Italic className="size-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={cn(btn, editor.isActive("strike") && btnActive)}
        title="Strikethrough"
      >
        <Strikethrough className="size-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleCode().run()}
        className={cn(btn, editor.isActive("code") && btnActive)}
        title="Inline code"
      >
        <Code className="size-4" />
      </button>
      <button
        type="button"
        onClick={setLink}
        className={cn(btn, editor.isActive("link") && btnActive)}
        title="Link"
      >
        <LinkIcon className="size-4" />
      </button>
      <span className="mx-1 w-px h-5 bg-border" aria-hidden />
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={cn(btn, editor.isActive("blockquote") && btnActive)}
        title="Blockquote"
      >
        <Quote className="size-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        className={cn(btn, editor.isActive("codeBlock") && btnActive)}
        title="Code block"
      >
        <CodeSquare className="size-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={cn(btn, editor.isActive("bulletList") && btnActive)}
        title="Bullet list"
      >
        <List className="size-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={cn(btn, editor.isActive("orderedList") && btnActive)}
        title="Ordered list"
      >
        <ListOrdered className="size-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        className={btn}
        title="Horizontal rule"
      >
        <Minus className="size-4" />
      </button>
      <span className="mx-1 w-px h-5 bg-border" aria-hidden />
      <button
        type="button"
        onClick={() => setEmbedOpen(true)}
        className={cn(btn, editor.isActive("embed") && btnActive)}
        title="Embed (YouTube, iframe, or HTML)"
      >
        <Video className="size-4" />
      </button>
        </>
      )}
    </div>

      <Dialog open={embedOpen} onOpenChange={setEmbedOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Embed</DialogTitle>
            <DialogDescription>
              Paste a YouTube URL or any embed HTML (e.g. iframe code). YouTube links will be converted to a video embed.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="embed-input">URL or HTML</Label>
            <Textarea
              id="embed-input"
              rows={4}
              className="min-h-24"
              placeholder="https://www.youtube.com/watch?v=… or <iframe …></iframe>"
              value={embedInput}
              onChange={(e) => setEmbedInput(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEmbedOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={insertEmbed} disabled={!embedInput.trim()}>
              Insert
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

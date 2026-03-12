"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AddFromFilesDialog } from "@/components/deck-builder/add-from-files-dialog";
import { ShareDeckSheet } from "@/components/share-form/share-deck-sheet";
import { RichTextEditor } from "@/components/share-form/rich-text-editor";
import { Folder, Trash2, Share2, ArrowLeft, History, Pencil } from "lucide-react";
import { FileTypeIcon } from "@/components/file-type-icon";

type FileRecord = { id: string; name: string; mimeType: string } | null;
type DirRecord = { id: string; name: string } | null;
type Item = {
  id: string;
  order: number;
  fileId: string | null;
  directoryId: string | null;
  file: FileRecord;
  directory: DirRecord;
};
type Deck = {
  id: string;
  name: string;
  description: string | null;
  items: Item[];
};

type HistoryEntry = {
  id: string;
  action: string;
  payload: unknown;
  createdAt: string;
  byUser: { email: string; name: string | null };
  deckItem: { file: FileRecord; directory: DirRecord };
};

function EditDeckDialog({
  deck,
  open,
  onOpenChange,
  onSave,
}: {
  deck: Deck;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (payload: { name?: string; description?: string | null }) => Promise<void>;
}) {
  const [name, setName] = useState(deck.name);
  const [description, setDescription] = useState(deck.description ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName(deck.name);
      setDescription(deck.description ?? "");
      setError(null);
    }
  }, [open, deck.name, deck.description]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Name is required");
      return;
    }
    setSaving(true);
    try {
      await onSave({
        name: trimmedName,
        description: description.trim() || null,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="container min-w-lg max-w-[calc(100%-2rem)]">
        <DialogHeader>
          <DialogTitle>Edit deck</DialogTitle>
          <DialogDescription>Change the deck name and description.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
          <div className="space-y-2">
            <Label htmlFor="deck-name">Name</Label>
            <Input
              id="deck-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Deck name"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="deck-description">Description (optional)</Label>
            <RichTextEditor
              value={description}
              onChange={setDescription}
              placeholder="Short description…"
              className="min-h-[100px]"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function DeckDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const [deck, setDeck] = useState<Deck | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [shareSheetOpen, setShareSheetOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [loading, setLoading] = useState(true);

  function refresh() {
    setLoading(true);
    Promise.all([
      fetch(`/api/decks/${id}`).then((r) => r.json()),
      fetch(`/api/decks/${id}/history`).then((r) => r.json()),
    ])
      .then(([deckRes, historyRes]) => {
        setDeck(deckRes.deck ?? null);
        setHistory(historyRes.history ?? []);
      })
      .catch(() => {
        setDeck(null);
        setHistory([]);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    refresh();
  }, [id]);

  useEffect(() => {
    if (searchParams.get("share") === "open") {
      setShareSheetOpen(true);
      router.replace(`/decks/${id}`, { scroll: false });
    }
  }, [id, searchParams, router]);

  async function removeItem(itemId: string) {
    if (!confirm("Remove this item from the deck?")) return;
    const res = await fetch(`/api/decks/${id}/items?itemId=${itemId}`, { method: "DELETE" });
    if (res.ok) refresh();
  }

  async function handleAdd(items: { fileId?: string; directoryId?: string }[]) {
    for (const item of items) {
      const res = await fetch(`/api/decks/${id}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId: item.fileId ?? null, directoryId: item.directoryId ?? null }),
      });
      if (!res.ok) break;
    }
    if (items.length > 0) refresh();
  }

  async function handleUpdateDeck(payload: { name?: string; description?: string | null }) {
    const res = await fetch(`/api/decks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      throw new Error(json.error ?? "Failed to update deck");
    }
    const json = await res.json();
    setDeck(json.deck);
    setEditDialogOpen(false);
  }

  if (loading && !deck) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }
  if (!deck) {
    return (
      <div className="p-6">
        <p className="text-destructive">Deck not found.</p>
        <Button variant="link" asChild>
          <Link href="/decks">Back to decks</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/decks">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">{deck.name}</h1>
            {deck.description && (
              <div
                className="text-muted-foreground text-sm prose prose-sm dark:prose-invert max-w-none line-clamp-1"
                dangerouslySetInnerHTML={{ __html: deck.description }}
              />
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={() => setEditDialogOpen(true)} title="Edit deck">
            <Pencil className="size-4" />
          </Button>
          <Button variant="outline" onClick={() => setShowHistory(!showHistory)}>
            <History className="size-4 mr-2" />
            History
          </Button>
          <Button variant="outline" onClick={() => setAddDialogOpen(true)}>
            Add from files
          </Button>
          <Button onClick={() => setShareSheetOpen(true)}>
            <Share2 className="size-4 mr-2" />
            Share
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Items</CardTitle>
          <CardDescription>Files and folders in this deck.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deck.items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-muted-foreground text-center py-8">
                    No items. Click &quot;Add from files&quot; to add files or folders.
                  </TableCell>
                </TableRow>
              ) : (
                deck.items.map((item) => (
                  <TableRow
                    key={item.id}
                    className="cursor-pointer hover:bg-muted/50"
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {item.file ? (
                          <>
                            <FileTypeIcon mimeType={item.file.mimeType} name={item.file.name} className="size-4 text-muted-foreground" />
                            {item.file.name}
                          </>
                        ) : item.directory ? (
                          <>
                            <Folder className="size-4 text-muted-foreground" />
                            {item.directory.name}
                          </>
                        ) : (
                          "—"
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{item.file ? "File" : "Folder"}</TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => removeItem(item.id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {showHistory && (
        <Card>
          <CardHeader>
            <CardTitle>Change history</CardTitle>
            <CardDescription>Who added or removed items and when.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>By</TableHead>
                  <TableHead>Resource</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-muted-foreground text-center py-4">
                      No history yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  history.map((h) => (
                    <TableRow
                      key={h.id}
                      className="cursor-pointer hover:bg-muted/50"
                    >
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(h.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell>{h.action}</TableCell>
                      <TableCell>{h.byUser.name ?? h.byUser.email}</TableCell>
                      <TableCell>
                        {h.deckItem?.file?.name ?? h.deckItem?.directory?.name ?? "—"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <AddFromFilesDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onAdd={handleAdd}
      />
      <ShareDeckSheet
        deckId={id}
        open={shareSheetOpen}
        onOpenChange={setShareSheetOpen}
      />
      <EditDeckDialog
        deck={deck}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSave={handleUpdateDeck}
      />
    </div>
  );
}

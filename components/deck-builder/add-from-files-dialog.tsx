"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FileTypeIcon } from "@/components/file-type-icon";
import { DirectoryTree } from "@/components/file-manager/directory-tree";

type FileRecord = { id: string; name: string; mimeType: string };

type AddItem = { fileId?: string; directoryId?: string };

export function AddFromFilesDialog({
  open,
  onOpenChange,
  onAdd,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (items: AddItem[]) => void | Promise<void>;
}) {
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [currentDirId, setCurrentDirId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedFileIds, setSelectedFileIds] = useState<Set<string>>(new Set());
  const [selectedDirIds, setSelectedDirIds] = useState<Set<string>>(new Set());
  const [adding, setAdding] = useState(false);
  const [treeRefreshKey, setTreeRefreshKey] = useState(0);

  useEffect(() => {
    if (!open) return;
    setSelectedFileIds(new Set());
    setSelectedDirIds(new Set());
    setTreeRefreshKey((k) => k + 1);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch("/api/files?directoryId=" + (currentDirId ?? ""))
      .then((r) => r.json())
      .then((res) => setFiles(res.files ?? []))
      .finally(() => setLoading(false));
  }, [open, currentDirId]);

  const toggleFile = useCallback((fileId: string) => {
    setSelectedFileIds((prev) => {
      const next = new Set(prev);
      if (next.has(fileId)) next.delete(fileId);
      else next.add(fileId);
      return next;
    });
  }, []);

  const toggleDir = useCallback((directoryId: string) => {
    setSelectedDirIds((prev) => {
      const next = new Set(prev);
      if (next.has(directoryId)) next.delete(directoryId);
      else next.add(directoryId);
      return next;
    });
  }, []);

  const selectedItems: AddItem[] = [
    ...Array.from(selectedFileIds).map((fileId) => ({ fileId })),
    ...Array.from(selectedDirIds).map((directoryId) => ({ directoryId })),
  ];
  const hasSelection = selectedItems.length > 0;

  async function handleAdd(andClose: boolean) {
    if (!hasSelection) return;
    setAdding(true);
    try {
      await onAdd(selectedItems);
      setSelectedFileIds(new Set());
      setSelectedDirIds(new Set());
      if (andClose) onOpenChange(false);
    } finally {
      setAdding(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-4xl max-w-8xl h-[70vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Add from files</DialogTitle>
          <DialogDescription>
            Choose a file or folder to add to the deck.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-1 min-h-0 gap-4">
          <div className="border rounded-md p-2 overflow-auto flex-1 min-w-0">
            <h3 className="mb-2 text-sm font-medium text-muted-foreground">Folders</h3>
            <DirectoryTree
              selectedId={currentDirId}
              onSelect={setCurrentDirId}
              refreshKey={treeRefreshKey}
              showCheckbox
              checkedDirectoryIds={selectedDirIds}
              onCheckDirectory={toggleDir}
            />
          </div>
          <div className="border rounded-md p-2 overflow-auto flex-1">
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : (
              <ul className="space-y-1">
                {files.map((f) => (
                  <li key={f.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`file-${f.id}`}
                      checked={selectedFileIds.has(f.id)}
                      onCheckedChange={() => toggleFile(f.id)}
                      aria-label={`Add file ${f.name}`}
                    />
                    <label
                      htmlFor={`file-${f.id}`}
                      className="flex flex-1 items-center gap-2 truncate cursor-pointer"
                    >
                      <FileTypeIcon mimeType={f.mimeType} name={f.name} className="size-4 shrink-0" />
                      {f.name}
                    </label>
                  </li>
                ))}
                {files.length === 0 && !loading && (
                  <li className="text-sm text-muted-foreground">No files in this folder.</li>
                )}
              </ul>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2 border-t">
          <Button
            variant="outline"
            onClick={() => handleAdd(false)}
            disabled={!hasSelection || adding}
          >
            Add
          </Button>
          <Button
            onClick={() => handleAdd(true)}
            disabled={!hasSelection || adding}
          >
            {adding ? "Adding…" : "Add and close"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

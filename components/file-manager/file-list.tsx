"use client";

import { useEffect, useState } from "react";
import { Folder, MoreHorizontal, Pencil } from "lucide-react";
import { FileTypeIcon } from "@/components/file-type-icon";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CreateDirectoryDialog } from "./create-directory-dialog";
import { UploadDialog } from "./upload-dialog";
import { RenameDialog } from "./rename-dialog";

type FileRecord = {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  createdAt: string;
};

type DirectoryRecord = { id: string; name: string; parentId: string | null };

export function FileList({
  directoryId,
  onSelectDirectory,
  onOpenFile,
  onDirectoryRenamed,
}: {
  directoryId: string | null;
  onSelectDirectory?: (id: string) => void;
  onOpenFile?: (file: FileRecord) => void;
  onDirectoryRenamed?: () => void;
}) {
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [subdirs, setSubdirs] = useState<DirectoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [renameTarget, setRenameTarget] = useState<
    { kind: "file"; id: string; name: string } | { kind: "directory"; id: string; name: string } | null
  >(null);

  function refresh() {
    setLoading(true);
    Promise.all([
      fetch("/api/files?directoryId=" + (directoryId ?? "")).then((r) => r.json()),
      fetch("/api/directories?parentId=" + (directoryId ?? "")).then((r) => r.json()),
    ])
      .then(([filesRes, dirsRes]) => {
        setFiles(filesRes.files ?? []);
        setSubdirs(dirsRes.directories ?? []);
      })
      .catch(() => {
        setFiles([]);
        setSubdirs([]);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    refresh();
  }, [directoryId]);

  function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">
          {directoryId ? "Folder contents" : "All files (root)"}
        </h2>
        <div className="flex gap-2">
          <CreateDirectoryDialog parentId={directoryId} onCreated={refresh} />
          <UploadDialog directoryId={directoryId} onUploaded={refresh} />
        </div>
      </div>
      {loading ? (
        <p className="text-muted-foreground text-sm">Loading…</p>
      ) : (
        <>
          <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="w-[70px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subdirs.map((d) => (
              <TableRow
                key={d.id}
                className={onSelectDirectory ? "cursor-pointer hover:bg-muted/50" : ""}
                onClick={() => onSelectDirectory?.(d.id)}
                onDoubleClick={() => onSelectDirectory?.(d.id)}
              >
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Folder className="size-4 text-muted-foreground" />
                    {d.name}
                  </div>
                </TableCell>
                <TableCell>—</TableCell>
                <TableCell>Folder</TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="size-8">
                        <MoreHorizontal className="size-4" aria-label="Actions" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() =>
                          setRenameTarget({ kind: "directory", id: d.id, name: d.name })
                        }
                      >
                        <Pencil className="size-4 mr-2" />
                        Rename
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {files.map((f) => (
              <TableRow
                key={f.id}
                className={onOpenFile ? "cursor-pointer hover:bg-muted/50" : ""}
                onClick={() => onOpenFile?.(f)}
                onDoubleClick={() => onOpenFile?.(f)}
              >
                <TableCell>
                  <div className="flex items-center gap-2">
                    <FileTypeIcon mimeType={f.mimeType} name={f.name} className="size-4 text-muted-foreground" />
                    {f.name}
                  </div>
                </TableCell>
                <TableCell>{formatSize(f.size)}</TableCell>
                <TableCell className="text-muted-foreground">{f.mimeType}</TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="size-8">
                        <MoreHorizontal className="size-4" aria-label="Actions" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() =>
                          setRenameTarget({
                            kind: "file",
                            id: f.id,
                            name: f.name,
                          })
                        }
                      >
                        <Pencil className="size-4 mr-2" />
                        Rename
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {subdirs.length === 0 && files.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-muted-foreground text-center py-8">
                  No files or folders. Upload a file or create a folder.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <RenameDialog
          target={renameTarget}
          onClose={() => setRenameTarget(null)}
          onRenamed={refresh}
          onDirectoryRenamed={onDirectoryRenamed}
        />
        </>
      )}
    </div>
  );
}

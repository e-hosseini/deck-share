"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { DirectoryTree } from "@/components/file-manager/directory-tree";
import { FileList } from "@/components/file-manager/file-list";
import { FullscreenFileViewer } from "@/components/file-manager/fullscreen-file-viewer";

type OpenFile = { id: string; name: string; mimeType: string };

export default function FilesPage() {
  const searchParams = useSearchParams();
  const urlFileId = searchParams.get("fileId");
  const urlDirectoryId = searchParams.get("directoryId");

  const [selectedDirectoryId, setSelectedDirectoryId] = useState<string | null>(() => urlDirectoryId);
  const [openFile, setOpenFile] = useState<OpenFile | null>(null);
  const [treeRefreshKey, setTreeRefreshKey] = useState(0);

  useEffect(() => {
    if (urlDirectoryId) {
      setSelectedDirectoryId(urlDirectoryId);
    }
  }, [urlDirectoryId]);

  useEffect(() => {
    if (!urlFileId) return;
    let cancelled = false;
    fetch(`/api/files/${urlFileId}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled || data.error) return;
        const f = data.file;
        if (f?.id && f?.name != null && f?.mimeType != null) {
          setOpenFile({ id: f.id, name: f.name, mimeType: f.mimeType });
          if (f.directoryId) setSelectedDirectoryId(f.directoryId);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [urlFileId]);

  return (
    <div className="flex flex-1 gap-6 p-6">
      <aside className="w-56 shrink-0 border-r pr-4">
        <h2 className="mb-2 text-sm font-medium text-muted-foreground">Folders</h2>
        <DirectoryTree
          selectedId={selectedDirectoryId}
          onSelect={setSelectedDirectoryId}
          refreshKey={treeRefreshKey}
        />
      </aside>
      <div className="min-w-0 flex-1">
        <FileList
          directoryId={selectedDirectoryId}
          onSelectDirectory={setSelectedDirectoryId}
          onOpenFile={(f) => setOpenFile({ id: f.id, name: f.name, mimeType: f.mimeType })}
          onDirectoryRenamed={() => setTreeRefreshKey((k) => k + 1)}
        />
      </div>

      {openFile && (
        <FullscreenFileViewer
          fileId={openFile.id}
          name={openFile.name}
          mimeType={openFile.mimeType}
          onClose={() => setOpenFile(null)}
        />
      )}
    </div>
  );
}

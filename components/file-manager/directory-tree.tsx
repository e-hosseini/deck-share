"use client";

import { useEffect, useState } from "react";
import { ChevronRight, Folder, FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";

type Directory = { id: string; name: string; parentId: string | null };

function getAncestorIds(directories: Directory[], targetId: string | null): Set<string> {
  if (!targetId) return new Set();
  const byId = new Map(directories.map((d) => [d.id, d]));
  const expanded = new Set<string>();
  let current = byId.get(targetId);
  while (current?.parentId) {
    expanded.add(current.parentId);
    current = byId.get(current.parentId);
  }
  return expanded;
}

export function DirectoryTree({
  selectedId,
  onSelect,
  refreshKey,
  showCheckbox,
  checkedDirectoryIds,
  onCheckDirectory,
}: {
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  refreshKey?: number;
  showCheckbox?: boolean;
  checkedDirectoryIds?: Set<string>;
  onCheckDirectory?: (id: string) => void;
}) {
  const [directories, setDirectories] = useState<Directory[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch("/api/directories?tree=true")
      .then((r) => r.json())
      .then((data: { directories: Directory[] }) => setDirectories(data.directories ?? []))
      .catch(() => setDirectories([]));
  }, [refreshKey]);

  useEffect(() => {
    if (directories.length === 0 || !selectedId) return;
    const ancestors = getAncestorIds(directories, selectedId);
    if (ancestors.size === 0) return;
    setExpanded((prev) => {
      const next = new Set(prev);
      ancestors.forEach((id) => next.add(id));
      return next.size === prev.size ? prev : next;
    });
  }, [directories, selectedId]);

  function buildTree(parentId: string | null): Directory[] {
    return directories.filter((d) => d.parentId === parentId);
  }

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="space-y-0.5">
      <button
        type="button"
        onClick={() => onSelect(null)}
        className={cn(
          "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent",
          selectedId === null && "bg-accent font-medium"
        )}
      >
        <FolderOpen className="size-4 shrink-0" />
        <span>All files</span>
      </button>
      {buildTree(null).map((dir) => (
        <TreeNode
          key={dir.id}
          dir={dir}
          selectedId={selectedId}
          onSelect={onSelect}
          expanded={expanded}
          onToggleExpand={toggleExpand}
          buildTree={buildTree}
          depth={0}
          showCheckbox={showCheckbox}
          checkedDirectoryIds={checkedDirectoryIds}
          onCheckDirectory={onCheckDirectory}
        />
      ))}
    </div>
  );
}

function TreeNode({
  dir,
  selectedId,
  onSelect,
  expanded,
  onToggleExpand,
  buildTree,
  depth,
  showCheckbox,
  checkedDirectoryIds,
  onCheckDirectory,
}: {
  dir: Directory;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  expanded: Set<string>;
  onToggleExpand: (id: string) => void;
  buildTree: (parentId: string | null) => Directory[];
  depth: number;
  showCheckbox?: boolean;
  checkedDirectoryIds?: Set<string>;
  onCheckDirectory?: (id: string) => void;
}) {
  const children = buildTree(dir.id);
  const isExpanded = expanded.has(dir.id);
  const isSelected = selectedId === dir.id;

  return (
    <div className="ml-0">
      <div
        className={cn(
          "flex items-center gap-1 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent",
          isSelected && "bg-accent font-medium"
        )}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        <button
          type="button"
          onClick={() => onToggleExpand(dir.id)}
          className="p-0.5 hover:bg-muted rounded"
        >
          <ChevronRight
            className={cn("size-4 shrink-0 transition-transform", isExpanded && "rotate-90")}
          />
        </button>
        <button
          type="button"
          onClick={() => onSelect(dir.id)}
          className="flex flex-1 items-center gap-2 min-w-0"
        >
          {isExpanded ? (
            <FolderOpen className="size-4 shrink-0" />
          ) : (
            <Folder className="size-4 shrink-0" />
          )}
          <span className="truncate">{dir.name}</span>
        </button>
        {showCheckbox && onCheckDirectory && checkedDirectoryIds !== undefined && (
          <Checkbox
            checked={checkedDirectoryIds.has(dir.id)}
            onCheckedChange={() => onCheckDirectory(dir.id)}
            aria-label={`Add folder ${dir.name}`}
            onClick={(e) => e.stopPropagation()}
          />
        )}
      </div>
      {isExpanded &&
        children.map((child) => (
          <TreeNode
            key={child.id}
            dir={child}
            selectedId={selectedId}
            onSelect={onSelect}
            expanded={expanded}
            onToggleExpand={onToggleExpand}
            buildTree={buildTree}
            depth={depth + 1}
            showCheckbox={showCheckbox}
            checkedDirectoryIds={checkedDirectoryIds}
            onCheckDirectory={onCheckDirectory}
          />
        ))}
    </div>
  );
}

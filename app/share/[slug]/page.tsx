"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FullscreenShareFileViewer } from "@/components/share-viewer/fullscreen-share-file-viewer";
import { Folder, Download, ChevronRight, ArrowLeft } from "lucide-react";
import { FileTypeIcon } from "@/components/file-type-icon";

type DeckItem = {
  id: string;
  fileId: string | null;
  directoryId: string | null;
  file: { id: string; name: string; mimeType: string } | null;
  directory: { id: string; name: string } | null;
};

type ShareData = {
  share: {
    id: string;
    title: string;
    descriptionRichText: string | null;
    audienceName: string;
    targetLink: string | null;
    contactEmail: string | null;
  };
  deck: {
    id: string;
    name: string;
    items: DeckItem[];
  };
  cta: {
    title: string | null;
    description: string | null;
    link: string | null;
    linkLabel: string | null;
  } | null;
  siteSettings: {
    footerCopyright: string | null;
    footerLinks: { label: string; url: string }[];
    posthogProjectKey: string | null;
    posthogHost: string | null;
    logoUrl: string | null;
  };
};

type FileRef = { fileId: string; name: string; mimeType: string };

type DirectoryContents = {
  directory: { id: string; name: string };
  directories: { id: string; name: string }[];
  files: { id: string; name: string; mimeType: string }[];
};

function getFingerprint(): string {
  if (typeof window === "undefined") return "";
  const s = [
    navigator.userAgent,
    navigator.language,
    String(screen.width),
    String(screen.height),
    new Date().getTimezoneOffset(),
  ].join("|");
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    h = (h << 5) - h + c;
    h |= 0;
  }
  return String(h);
}

export default function SharePage() {
  const params = useParams();
  const slug = params.slug as string;
  const [data, setData] = useState<ShareData | null>(null);
  const [needsPassword, setNeedsPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [singleUseExhausted, setSingleUseExhausted] = useState(false);
  const [openFile, setOpenFile] = useState<FileRef | null>(null);
  const [downloadFile, setDownloadFile] = useState<FileRef | null>(null);
  const [directoryStack, setDirectoryStack] = useState<{ id: string; name: string }[]>([]);
  const [directoryContents, setDirectoryContents] = useState<DirectoryContents | null>(null);
  const [directoryLoading, setDirectoryLoading] = useState(false);
  const [ctaModalOpen, setCtaModalOpen] = useState(false);
  const fingerprint = getFingerprint();

  const track = useCallback(
    async (action: string, resourceType?: string, resourceId?: string) => {
      try {
        const res = await fetch("/api/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            slug,
            fingerprint,
            action,
            resourceType,
            resourceId,
          }),
        });
        const json = await res.json();
        if (json.singleUseExhausted) setSingleUseExhausted(true);
      } catch {
        // ignore
      }
    },
    [slug, fingerprint]
  );

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/share/${slug}/access`)
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return;
        if (json.needsPassword) {
          setNeedsPassword(true);
          setLoading(false);
          return;
        }
        if (json.error) {
          setLoading(false);
          return;
        }
        setData({ share: json.share, deck: json.deck, cta: json.cta ?? null, siteSettings: json.siteSettings ?? { footerCopyright: null, footerLinks: [], posthogProjectKey: null, posthogHost: null, logoUrl: null } });
        setLoading(false);
        track("page_view");
      })
      .catch(() => setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [slug, track]);

  useEffect(() => {
    if (directoryStack.length === 0) {
      setDirectoryContents(null);
      return;
    }
    const { id } = directoryStack[directoryStack.length - 1];
    let cancelled = false;
    setDirectoryLoading(true);
    fetch(`/api/share/${slug}/directory/${id}`)
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return;
        if (json.error) {
          setDirectoryContents(null);
          return;
        }
        setDirectoryContents(json);
      })
      .finally(() => {
        if (!cancelled) setDirectoryLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug, directoryStack]);

  // Load PostHog when config is available (share page only)
  useEffect(() => {
    if (!data?.siteSettings?.posthogProjectKey) return;
    const key = data.siteSettings.posthogProjectKey.trim();
    if (!key) return;
    let cancelled = false;
    import("posthog-js").then(({ default: posthog }) => {
      if (cancelled) return;
      posthog.init(key, {
        api_host: data.siteSettings.posthogHost?.trim() || "https://us.i.posthog.com",
        person_profiles: "identified_only",
      });
    });
    return () => {
      cancelled = true;
    };
  }, [data?.siteSettings?.posthogProjectKey, data?.siteSettings?.posthogHost]);

  async function submitPassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError(null);
    const res = await fetch(`/api/share/${slug}/access`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const json = await res.json();
    if (!res.ok) {
      setPasswordError(json.error ?? "Invalid password");
      return;
    }
    setNeedsPassword(false);
    const accessRes = await fetch(`/api/share/${slug}/access`);
    const accessJson = await accessRes.json();
    setData({ share: accessJson.share, deck: accessJson.deck, cta: accessJson.cta ?? null, siteSettings: accessJson.siteSettings ?? { footerCopyright: null, footerLinks: [], posthogProjectKey: null, posthogHost: null, logoUrl: null } });
    track("page_view");
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (needsPassword) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-sm space-y-4">
          <h1 className="text-xl font-semibold">This share is protected</h1>
          <form onSubmit={submitPassword} className="space-y-4">
            {passwordError && (
              <p className="text-sm text-destructive">{passwordError}</p>
            )}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
              />
            </div>
            <Button type="submit" className="w-full">
              Continue
            </Button>
          </form>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-destructive">Share not found or expired.</p>
      </div>
    );
  }

  if (singleUseExhausted) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">This link has already been used.</p>
      </div>
    );
  }

  const { share, deck, cta } = data;
  const { footerCopyright, footerLinks, logoUrl } = data.siteSettings;
  const isInDirectory = directoryStack.length > 0;

  function enterDirectory(id: string, name: string) {
    track("directory_open", "directory", id);
    setDirectoryStack((prev) => [...prev, { id, name }]);
  }

  function goBack() {
    setDirectoryStack((prev) => prev.slice(0, -1));
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top: menu / header */}
      <header className="shrink-0 border-b bg-background">
        <div className="flex flex-wrap items-start justify-between gap-4 p-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3">
              {logoUrl && (
                <img
                  src={logoUrl}
                  alt=""
                  className="h-8 w-8 shrink-0 object-contain"
                />
              )}
              <h1 className="text-2xl font-semibold">{share.title}</h1>
            </div>
            {share.descriptionRichText && (
              <div
                className="mt-2 prose prose-sm dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: share.descriptionRichText }}
              />
            )}
            {share.targetLink && (
              <a
                href={share.targetLink}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block text-primary underline"
              >
                {share.targetLink}
              </a>
            )}
          </div>
          {cta && cta.title && cta.link && (
            <Button
              variant="default"
              onClick={() => setCtaModalOpen(true)}
              className="shrink-0"
            >
              {cta.title}
            </Button>
          )}
        </div>
      </header>

      {/* Middle: file/dir browser (scrollable) */}
      <main className="flex-1 min-h-0 flex flex-col overflow-auto">
        <div className="p-4 pb-0">
          {isInDirectory && (
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <ChevronRight className="size-4 text-muted-foreground" />
              <nav className="flex items-center gap-2 text-sm">
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1 -ml-2"
                  onClick={goBack}
                >
                  <ArrowLeft className="size-4" />
                  Back
                </Button>
                {directoryStack.map((d) => (
                  <span key={d.id} className="flex items-center gap-2">
                    <ChevronRight className="size-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{d.name}</span>
                  </span>
                ))}
              </nav>
            </div>
          )}
        </div>
        <div className="flex-1 p-4">
          {isInDirectory ? (
            directoryLoading ? (
              <p className="text-muted-foreground">Loading…</p>
            ) : directoryContents ? (
              <ul className="space-y-2">
                {directoryContents.directories.map((dir) => (
                  <li
                    key={dir.id}
                    className="flex cursor-pointer items-center justify-between gap-4 rounded-md border p-3 hover:bg-muted/50"
                    onDoubleClick={() => enterDirectory(dir.id, dir.name)}
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <Folder className="size-4 shrink-0" />
                      <span className="truncate">{dir.name}</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => enterDirectory(dir.id, dir.name)}
                    >
                      Open
                    </Button>
                  </li>
                ))}
                {directoryContents.files.map((file) => (
                  <li
                    key={file.id}
                    className="flex cursor-pointer items-center justify-between gap-4 rounded-md border p-3 hover:bg-muted/50"
                    onDoubleClick={() =>
                      setOpenFile({
                        fileId: file.id,
                        name: file.name,
                        mimeType: file.mimeType,
                      })
                    }
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <FileTypeIcon mimeType={file.mimeType} name={file.name} className="size-4 shrink-0" />
                      <span className="truncate">{file.name}</span>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setOpenFile({
                            fileId: file.id,
                            name: file.name,
                            mimeType: file.mimeType,
                          })
                        }
                      >
                        Open
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setDownloadFile({
                            fileId: file.id,
                            name: file.name,
                            mimeType: file.mimeType,
                          })
                        }
                      >
                        <Download className="mr-1 size-4" />
                        Download
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">Unable to load directory.</p>
            )
          ) : (
            <ul className="space-y-2">
              {deck.items.map((item) => (
                <li
                  key={item.id}
                  className={`flex items-center justify-between gap-4 rounded-md border p-3 ${item.file || item.directory ? "cursor-pointer hover:bg-muted/50" : ""}`}
                  onDoubleClick={() => {
                    if (item.file) {
                      setOpenFile({
                        fileId: item.file.id,
                        name: item.file.name,
                        mimeType: item.file.mimeType,
                      });
                    } else if (item.directory) {
                      enterDirectory(item.directory.id, item.directory.name);
                    }
                  }}
                >
                  <div className="flex min-w-0 items-center gap-2">
                    {item.file ? (
                      <>
                        <FileTypeIcon mimeType={item.file.mimeType} name={item.file.name} className="size-4 shrink-0" />
                        <span className="truncate">{item.file.name}</span>
                      </>
                    ) : item.directory ? (
                      <>
                        <Folder className="size-4 shrink-0" />
                        <span className="truncate">{item.directory.name}</span>
                      </>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 gap-2">
                    {item.file && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setOpenFile({
                              fileId: item.file!.id,
                              name: item.file!.name,
                              mimeType: item.file!.mimeType,
                            })
                          }
                        >
                          Open
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setDownloadFile({
                              fileId: item.file!.id,
                              name: item.file!.name,
                              mimeType: item.file!.mimeType,
                            })
                          }
                        >
                          <Download className="mr-1 size-4" />
                          Download
                        </Button>
                      </>
                    )}
                    {item.directory && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          enterDirectory(item.directory!.id, item.directory!.name)
                        }
                      >
                        Open
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>

      {/* Bottom: footer */}
      {(footerCopyright || footerLinks.length > 0) && (
        <footer className="shrink-0 border-t bg-background p-4 text-center text-sm text-muted-foreground">
          {footerCopyright && <p>{footerCopyright}</p>}
          {footerLinks.length > 0 && (
            <nav className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
              {footerLinks.map((link, i) => (
                <a
                  key={i}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-foreground"
                >
                  {link.label}
                </a>
              ))}
            </nav>
          )}
        </footer>
      )}
      {openFile && (
        <FullscreenShareFileViewer
          slug={slug}
          fileId={openFile.fileId}
          name={openFile.name}
          mimeType={openFile.mimeType}
          onClose={() => setOpenFile(null)}
          onTrackOpen={() => track("file_open", "file", openFile.fileId)}
        />
      )}

      <Dialog open={!!downloadFile} onOpenChange={(o) => !o && setDownloadFile(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Download</DialogTitle>
            <DialogDescription>
              The data in this file must not be shared without our approval. By
              downloading, you agree to keep the contents confidential.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDownloadFile(null)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!downloadFile) return;
                track("file_download", "file", downloadFile.fileId);
                window.open(
                  `/api/share/${slug}/download/${downloadFile.fileId}`,
                  "_blank"
                );
                setDownloadFile(null);
              }}
            >
              I agree, download
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={ctaModalOpen} onOpenChange={setCtaModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{cta?.title ?? "Call to action"}</DialogTitle>
            {cta?.description && (
              <DialogDescription className="whitespace-pre-wrap">
                {cta.description}
              </DialogDescription>
            )}
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCtaModalOpen(false)}
            >
              Close
            </Button>
            <Button
              onClick={() => {
                if (cta?.link) {
                  window.open(cta.link, "_blank", "noopener,noreferrer");
                }
                setCtaModalOpen(false);
              }}
            >
              {cta?.linkLabel || "Open link"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

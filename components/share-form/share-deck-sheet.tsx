"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { toast } from "sonner";

function getDefaultExpiry() {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  return d.toISOString().slice(0, 16);
}

type ShareDeckSheetProps = {
  deckId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ShareDeckSheet({ deckId, open, onOpenChange }: ShareDeckSheetProps) {
  const [audienceName, setAudienceName] = useState("");
  const [expiresAt, setExpiresAt] = useState(() => getDefaultExpiry());
  const [targetLink, setTargetLink] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [password, setPassword] = useState("");
  const [singleUse, setSingleUse] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdSlug, setCreatedSlug] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setCreatedSlug(null);
      setError(null);
      setExpiresAt(getDefaultExpiry());
    }
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/decks/${deckId}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audienceName: audienceName.trim(),
          expiresAt: expiresAt || null,
          targetLink: targetLink.trim() || null,
          contactEmail: contactEmail.trim() || null,
          password: password.trim() || null,
          singleUse,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to create share");
      }
      const { share } = await res.json();
      setCreatedSlug(share.slug);
      const url = `${typeof window !== "undefined" ? window.location.origin : ""}/share/${share.slug}`;
      try {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied to clipboard");
      } catch {
        toast.info("Share created — copy the link below");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  const shareUrl =
    createdSlug && typeof window !== "undefined"
      ? `${window.location.origin}/share/${createdSlug}`
      : "";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col sm:max-w-md overflow-hidden p-0"
      >
        <div className="flex flex-1 flex-col overflow-hidden">
          {createdSlug ? (
            <>
              <SheetHeader className="shrink-0 border-b px-6 py-4">
                <SheetTitle>Share created</SheetTitle>
                <SheetDescription>
                  Share this link with your audience. You can view analytics in Shares.
                </SheetDescription>
              </SheetHeader>
              <div className="flex flex-1 flex-col gap-4 overflow-auto p-6">
                <div className="rounded-md bg-muted p-3 font-mono text-sm break-all">
                  {shareUrl}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() => {
                      navigator.clipboard.writeText(shareUrl);
                      toast.success("Link copied to clipboard");
                    }}
                  >
                    Copy link
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href={`/share/${createdSlug}`} target="_blank">
                      Open
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/shares">View all shares</Link>
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <>
              <SheetHeader className="shrink-0 border-b px-6 py-4">
                <SheetTitle>Create share</SheetTitle>
                <SheetDescription>
                  Set audience, expiry, and optional password. Title and description come from the deck. A unique link will be generated.
                </SheetDescription>
              </SheetHeader>
              <form
                onSubmit={handleSubmit}
                className="flex flex-1 flex-col overflow-hidden"
              >
                <div className="flex-1 space-y-4 overflow-auto px-6 py-4">
                  {error && (
                    <p className="text-sm text-destructive">{error}</p>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="sheet-audience">Audience name</Label>
                    <Input
                      id="sheet-audience"
                      value={audienceName}
                      onChange={(e) => setAudienceName(e.target.value)}
                      placeholder="e.g. Q1 Investors"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sheet-expiresAt">Expiry date</Label>
                    <Input
                      id="sheet-expiresAt"
                      type="datetime-local"
                      value={expiresAt}
                      onChange={(e) => setExpiresAt(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sheet-targetLink">Target link (optional)</Label>
                    <Input
                      id="sheet-targetLink"
                      type="url"
                      value={targetLink}
                      onChange={(e) => setTargetLink(e.target.value)}
                      placeholder="https://…"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sheet-contactEmail">Contact email (optional)</Label>
                    <Input
                      id="sheet-contactEmail"
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="contact@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sheet-password">Password (optional)</Label>
                    <Input
                      id="sheet-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Leave empty for no password"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="sheet-singleUse"
                      checked={singleUse}
                      onCheckedChange={(c) => setSingleUse(!!c)}
                    />
                    <Label
                      htmlFor="sheet-singleUse"
                      className="font-normal cursor-pointer"
                    >
                      Single use (only one unique visitor can open this link)
                    </Label>
                  </div>
                </div>
                <div className="shrink-0 flex gap-2 border-t px-6 py-4">
                  <Button type="submit" disabled={loading}>
                    {loading ? "Creating…" : "Create share"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

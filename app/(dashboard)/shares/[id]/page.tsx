"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Copy, ExternalLink, Pencil } from "lucide-react";
import { toast } from "sonner";

type Visitor = {
  id: string;
  fingerprintHash: string;
  firstSeenAt: string;
  lastSeenAt: string;
  ip: string | null;
  userAgent: string | null;
  country: string | null;
  region: string | null;
  referrer: string | null;
};

type ShareDetail = {
  share: {
    id: string;
    slug: string;
    title: string;
    audienceName: string;
    expiresAt: string;
    targetLink: string | null;
    contactEmail: string | null;
    singleUse: boolean;
    hasPassword: boolean;
    createdAt: string;
    deck: { name: string };
    metaTitle: string | null;
    metaDescription: string | null;
    firstOpenedAt: string | null;
    lastOpenedAt: string | null;
    uniqueVisitors: number;
  };
  visitors: Visitor[];
};

export default function ShareAnalyticsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [data, setData] = useState<ShareDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editAudienceName, setEditAudienceName] = useState("");
  const [editExpiresAt, setEditExpiresAt] = useState("");
  const [editTargetLink, setEditTargetLink] = useState("");
  const [editContactEmail, setEditContactEmail] = useState("");
  const [editNewPassword, setEditNewPassword] = useState("");
  const [editSingleUse, setEditSingleUse] = useState(false);
  const [editMetaTitle, setEditMetaTitle] = useState("");
  const [editMetaDescription, setEditMetaDescription] = useState("");

  useEffect(() => {
    fetch(`/api/shares/${id}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [id]);

  function openEditModal() {
    if (!data?.share) return;
    const s = data.share;
    setEditAudienceName(s.audienceName);
    setEditExpiresAt(s.expiresAt ? new Date(s.expiresAt).toISOString().slice(0, 16) : "");
    setEditTargetLink(s.targetLink ?? "");
    setEditContactEmail(s.contactEmail ?? "");
    setEditNewPassword("");
    setEditSingleUse(s.singleUse);
    setEditMetaTitle(s.metaTitle ?? "");
    setEditMetaDescription(s.metaDescription ?? "");
    setEditOpen(true);
  }

  async function saveShare(e: React.FormEvent) {
    e.preventDefault();
    setEditSaving(true);
    try {
      const body: Record<string, unknown> = {
        audienceName: editAudienceName.trim(),
        targetLink: editTargetLink.trim() || null,
        contactEmail: editContactEmail.trim() || null,
        singleUse: editSingleUse,
        metaTitle: editMetaTitle.trim() || null,
        metaDescription: editMetaDescription.trim() || null,
      };
      if (editExpiresAt) body.expiresAt = new Date(editExpiresAt).toISOString();
      if (editNewPassword.trim()) body.password = editNewPassword.trim();
      const res = await fetch(`/api/shares/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Failed to save");
      }
      const json = await res.json();
      setData((prev) =>
        prev
          ? {
              ...prev,
              share: {
                ...prev.share,
                audienceName: json.share.audienceName,
                expiresAt: json.share.expiresAt ?? prev.share.expiresAt,
                targetLink: json.share.targetLink,
                contactEmail: json.share.contactEmail,
                hasPassword: json.share.hasPassword,
                singleUse: json.share.singleUse,
                metaTitle: json.share.metaTitle,
                metaDescription: json.share.metaDescription,
              },
            }
          : null
      );
      setEditOpen(false);
      toast.success("Share updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setEditSaving(false);
    }
  }

  if (loading || !data) {
    return (
      <div className="p-6">
        {loading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : (
          <p className="text-destructive">Share not found.</p>
        )}
      </div>
    );
  }

  const { share, visitors } = data;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/shares">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">{share.title}</h1>
          <p className="text-muted-foreground text-sm">
            /share/{share.slug} · {share.deck.name}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <div className="space-y-1.5">
            <CardTitle>Share information</CardTitle>
            <CardDescription>
              Link and settings for this share.
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={openEditModal} className="shrink-0">
            <Pencil className="size-4 mr-1" />
            Edit share
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-muted-foreground">Share link</Label>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded-md bg-muted px-3 py-2 text-sm break-all">
                {typeof window !== "undefined" ? `${window.location.origin}/share/${share.slug}` : `/share/${share.slug}`}
              </code>
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  const url = typeof window !== "undefined" ? `${window.location.origin}/share/${share.slug}` : "";
                  if (url) {
                    navigator.clipboard.writeText(url);
                    toast.success("Link copied");
                  }
                }}
              >
                <Copy className="size-4" />
              </Button>
              <Button variant="outline" size="icon" asChild>
                <Link href={`/share/${share.slug}`} target="_blank">
                  <ExternalLink className="size-4" />
                </Link>
              </Button>
            </div>
          </div>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Audience</dt>
              <dd className="font-medium">{share.audienceName}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Expires</dt>
              <dd className="font-medium">
                {new Date(share.expiresAt).toLocaleString()}
                {new Date(share.expiresAt) < new Date() && (
                  <span className="ml-2 text-destructive">(expired)</span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Password</dt>
              <dd className="font-medium">{share.hasPassword ? "Required" : "None"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Single use</dt>
              <dd className="font-medium">{share.singleUse ? "Yes" : "No"}</dd>
            </div>
            {share.targetLink && (
              <div className="sm:col-span-2">
                <dt className="text-muted-foreground">Target link</dt>
                <dd>
                  <a
                    href={share.targetLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-primary hover:underline break-all"
                  >
                    {share.targetLink}
                  </a>
                </dd>
              </div>
            )}
            {share.contactEmail && (
              <div>
                <dt className="text-muted-foreground">Contact email</dt>
                <dd className="font-medium">{share.contactEmail}</dd>
              </div>
            )}
            <div>
              <dt className="text-muted-foreground">Created</dt>
              <dd className="font-medium">{new Date(share.createdAt).toLocaleString()}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Unique visitors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{share.uniqueVisitors}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              First opened
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              {share.firstOpenedAt
                ? new Date(share.firstOpenedAt).toLocaleString()
                : "—"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Last opened
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              {share.lastOpenedAt
                ? new Date(share.lastOpenedAt).toLocaleString()
                : "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto" showCloseButton>
          <DialogHeader>
            <DialogTitle>Edit share</DialogTitle>
            <DialogDescription>
              Update share settings and link preview (metadata) for this share.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={saveShare} className="space-y-6">
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Settings</h4>
              <div className="space-y-2">
                <Label htmlFor="editAudienceName">Audience name</Label>
                <Input
                  id="editAudienceName"
                  value={editAudienceName}
                  onChange={(e) => setEditAudienceName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editExpiresAt">Expires</Label>
                <Input
                  id="editExpiresAt"
                  type="datetime-local"
                  value={editExpiresAt}
                  onChange={(e) => setEditExpiresAt(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editTargetLink">Target link</Label>
                <Input
                  id="editTargetLink"
                  type="url"
                  value={editTargetLink}
                  onChange={(e) => setEditTargetLink(e.target.value)}
                  placeholder="https://…"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editContactEmail">Contact email</Label>
                <Input
                  id="editContactEmail"
                  type="email"
                  value={editContactEmail}
                  onChange={(e) => setEditContactEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editNewPassword">Password</Label>
                <Input
                  id="editNewPassword"
                  type="password"
                  value={editNewPassword}
                  onChange={(e) => setEditNewPassword(e.target.value)}
                  placeholder={share.hasPassword ? "Leave blank to keep current" : "Optional"}
                  autoComplete="new-password"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="editSingleUse"
                  checked={editSingleUse}
                  onCheckedChange={(c) => setEditSingleUse(c === true)}
                />
                <Label htmlFor="editSingleUse" className="font-normal cursor-pointer">
                  Single use link
                </Label>
              </div>
            </div>
            <div className="space-y-4 border-t pt-4">
              <h4 className="text-sm font-medium">Link preview (metadata)</h4>
              <p className="text-muted-foreground text-xs">
                Title and description when the link is shared (e.g. social). Empty = use deck title and description.
              </p>
              <div className="space-y-2">
                <Label htmlFor="editMetaTitle">Preview title</Label>
                <Input
                  id="editMetaTitle"
                  value={editMetaTitle}
                  onChange={(e) => setEditMetaTitle(e.target.value)}
                  placeholder={share.deck.name}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editMetaDescription">Preview description</Label>
                <Textarea
                  id="editMetaDescription"
                  value={editMetaDescription}
                  onChange={(e) => setEditMetaDescription(e.target.value)}
                  placeholder="Deck description"
                  rows={3}
                  className="resize-none"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={editSaving}>
                {editSaving ? "Saving…" : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>Visitors</CardTitle>
          <CardDescription>
            Unique visitors: IP, location, browser, first/last seen.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>First seen</TableHead>
                <TableHead>Last seen</TableHead>
                <TableHead>IP</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Referrer</TableHead>
                <TableHead className="w-[100px] text-right">Events</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visitors.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-muted-foreground text-center py-8">
                    No visitors yet.
                  </TableCell>
                </TableRow>
              ) : (
                visitors.map((v) => (
                  <TableRow
                    key={v.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => router.push(`/shares/${id}/visitors/${v.id}`)}
                  >
                    <TableCell className="text-sm">
                      {new Date(v.firstSeenAt).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-sm">
                      {new Date(v.lastSeenAt).toLocaleString()}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{v.ip ?? "—"}</TableCell>
                    <TableCell>{v.country ?? "—"}</TableCell>
                    <TableCell className="max-w-[200px] truncate text-muted-foreground">
                      {v.referrer ?? "—"}
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <Link
                        href={`/shares/${id}/visitors/${v.id}`}
                        className="text-sm text-primary hover:underline"
                      >
                        View events
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

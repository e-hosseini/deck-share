"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RichTextEditor } from "@/components/share-form/rich-text-editor";
import { ArrowLeft } from "lucide-react";

export default function CreateSharePage() {
  const params = useParams();
  const router = useRouter();
  const deckId = params.id as string;
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [audienceName, setAudienceName] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [targetLink, setTargetLink] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [password, setPassword] = useState("");
  const [singleUse, setSingleUse] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdSlug, setCreatedSlug] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/decks/${deckId}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          descriptionRichText: description.trim() || null,
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  if (createdSlug) {
    const shareUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/share/${createdSlug}`;
    return (
      <div className="p-6 max-w-lg">
        <Card>
          <CardHeader>
            <CardTitle>Share created</CardTitle>
            <CardDescription>Share this link with your audience. You can view analytics in Shares.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md bg-muted p-3 font-mono text-sm break-all">
              {shareUrl}
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(shareUrl);
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
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6 flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/decks/${deckId}`}>
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold">Create share</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Share settings</CardTitle>
          <CardDescription>
            Set title, audience, expiry, and optional password. A unique link will be generated.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Share title"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Description (rich text)</Label>
              <RichTextEditor
                value={description}
                onChange={setDescription}
                placeholder="Optional description for the audience…"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="audience">Audience name *</Label>
              <Input
                id="audience"
                value={audienceName}
                onChange={(e) => setAudienceName(e.target.value)}
                placeholder="e.g. Q1 Investors"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expiresAt">Expiry date *</Label>
              <Input
                id="expiresAt"
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="targetLink">Target link (optional)</Label>
              <Input
                id="targetLink"
                type="url"
                value={targetLink}
                onChange={(e) => setTargetLink(e.target.value)}
                placeholder="https://…"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactEmail">Contact email (optional)</Label>
              <Input
                id="contactEmail"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="contact@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password (optional)</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Leave empty for no password"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="singleUse"
                checked={singleUse}
                onCheckedChange={(c) => setSingleUse(!!c)}
              />
              <Label htmlFor="singleUse" className="font-normal cursor-pointer">
                Single use (only one unique visitor can open this link)
              </Label>
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={loading}>
                {loading ? "Creating…" : "Create share"}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href={`/decks/${deckId}`}>Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

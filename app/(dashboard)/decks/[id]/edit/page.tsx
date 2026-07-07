"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PlateDescriptionEditor } from "@/components/deck-form/plate-description-editor";
import { ArrowLeft } from "lucide-react";

export default function EditDeckPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoading(true);
    setLoaded(false);
    fetch(`/api/decks/${id}`)
      .then((r) => r.json())
      .then((data: { deck?: { name: string; description: string | null }; error?: string }) => {
        if (!data.deck) {
          setError(data.error ?? "Deck not found");
          return;
        }
        setName(data.deck.name);
        setDescription(data.deck.description ?? "");
        setLoaded(true);
      })
      .catch(() => setError("Failed to load deck"))
      .finally(() => setLoading(false));
  }, [id]);

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
      const res = await fetch(`/api/decks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          description: description.trim() || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to update deck");
      }
      router.push(`/decks/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6 container mx-auto">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (!loaded) {
    return (
      <div className="p-6 container mx-auto space-y-4">
        <p className="text-destructive">{error ?? "Deck not found."}</p>
        <Button variant="outline" asChild>
          <Link href="/decks">Back to decks</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 container mx-auto">
      <div className="mb-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/decks/${id}`}>
            <ArrowLeft className="size-4 mr-2" />
            Back to deck
          </Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Edit deck</CardTitle>
          <CardDescription>Change the deck name and description.</CardDescription>
        </CardHeader>
        <CardContent className="min-w-0">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Deck name"
                required
              />
            </div>
            <div className="min-w-0 space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <PlateDescriptionEditor
                key={id}
                value={description}
                onChange={setDescription}
                placeholder="Optional description…"
                className="min-h-[100px]"
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={saving}>
                {saving ? "Saving…" : "Save"}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.push(`/decks/${id}`)}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

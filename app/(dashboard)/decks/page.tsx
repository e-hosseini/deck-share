"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Plus, ExternalLink } from "lucide-react";

type Deck = {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  _count: { items: number; shares: number };
};

export default function DecksPage() {
  const router = useRouter();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/decks")
      .then((r) => r.json())
      .then((data: { decks: Deck[] }) => setDecks(data.decks ?? []))
      .catch(() => setDecks([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Decks</h1>
        <Button asChild>
          <Link href="/decks/new">
            <Plus className="size-4 mr-2" />
            New deck
          </Link>
        </Button>
      </div>
      {loading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : decks.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No decks yet</CardTitle>
            <CardDescription>Create a deck and add files or folders from your file manager.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/decks/new">
                <Plus className="size-4 mr-2" />
                Create deck
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Decks</CardTitle>
            <CardDescription>
              Open a deck to manage items and create share links.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Shares</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {decks.map((deck) => (
                  <TableRow
                    key={deck.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => router.push(`/decks/${deck.id}`)}
                  >
                    <TableCell className="font-medium">{deck.name}</TableCell>
                    <TableCell>{deck._count.items}</TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Button variant="link" className="h-auto p-0 font-normal" asChild>
                        <Link href={`/shares?deckId=${encodeURIComponent(deck.id)}`}>
                          {deck._count.shares}
                        </Link>
                      </Button>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(deck.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(deck.updatedAt).toLocaleString()}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/decks/${deck.id}`}>
                          Open
                          <ExternalLink className="size-3 ml-1" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

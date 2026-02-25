"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
import { ExternalLink } from "lucide-react";

type Share = {
  id: string;
  slug: string;
  title: string;
  audienceName: string;
  expiresAt: string;
  deck: { id: string; name: string };
  _count: { visitors: number };
  firstOpenedAt: string | null;
  lastOpenedAt: string | null;
};

export default function SharesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const deckId = searchParams.get("deckId");
  const [shares, setShares] = useState<Share[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const url = deckId ? `/api/shares?deckId=${encodeURIComponent(deckId)}` : "/api/shares";
    fetch(url)
      .then((r) => r.json())
      .then((data: { shares: Share[] }) => setShares(data.shares ?? []))
      .catch(() => setShares([]))
      .finally(() => setLoading(false));
  }, [deckId]);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Shares</h1>
      {deckId && (
        <p className="text-muted-foreground text-sm">
          Filtered by deck. <Link href="/shares" className="text-primary underline hover:no-underline">Show all shares</Link>
        </p>
      )}
      {loading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : shares.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No shares yet</CardTitle>
            <CardDescription>
              Create a share from a deck (Decks → open deck → Share) to get a shareable link.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Share links</CardTitle>
            <CardDescription>
              First/last opened and unique visitors are on each share&apos;s analytics page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Deck</TableHead>
                  <TableHead>Audience</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>First opened</TableHead>
                  <TableHead>Last opened</TableHead>
                  <TableHead>Visitors</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shares.map((s) => (
                  <TableRow
                    key={s.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => router.push(`/shares/${s.id}`)}
                  >
                    <TableCell className="font-medium">{s.title}</TableCell>
                    <TableCell className="font-mono text-sm">{s.slug}</TableCell>
                    <TableCell>{s.deck.name}</TableCell>
                    <TableCell>{s.audienceName}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(s.expiresAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {s.firstOpenedAt
                        ? new Date(s.firstOpenedAt).toLocaleString()
                        : "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {s.lastOpenedAt
                        ? new Date(s.lastOpenedAt).toLocaleString()
                        : "—"}
                    </TableCell>
                    <TableCell>{s._count.visitors}</TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/shares/${s.id}`}>
                          Analytics
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

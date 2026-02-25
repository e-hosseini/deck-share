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
import { ArrowLeft } from "lucide-react";

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
    deck: { name: string };
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

  useEffect(() => {
    fetch(`/api/shares/${id}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [id]);

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

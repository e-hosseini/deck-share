"use client";

import { Fragment, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Folder, ExternalLink } from "lucide-react";
import { FileTypeIcon } from "@/components/file-type-icon";

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

type Action = {
  id: string;
  action: string;
  resourceType: string | null;
  resourceId: string | null;
  resourceName: string | null;
  createdAt: string;
};

type VisitorEventsData = {
  share: { id: string; slug: string; title: string; deck: { name: string } };
  visitor: Visitor;
  actions: Action[];
};

function buildAdminResourceUrl(
  resourceType: string | null,
  resourceId: string | null
): string {
  if (!resourceType || !resourceId) return "/files";
  if (resourceType === "file") return `/files?fileId=${encodeURIComponent(resourceId)}`;
  return `/files?directoryId=${encodeURIComponent(resourceId)}`;
}

function ResourceLink({
  resourceType,
  resourceId,
  resourceName,
}: {
  resourceType: string | null;
  resourceId: string | null;
  resourceName?: string | null;
}) {
  if (!resourceType || !resourceId)
    return <span className="text-muted-foreground">—</span>;
  const href = buildAdminResourceUrl(resourceType, resourceId);
  const displayName = resourceName ?? `${resourceId.slice(0, 8)}…`;
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
    >
      {resourceType === "file" ? (
        <FileTypeIcon mimeType="" className="size-3.5 shrink-0" />
      ) : (
        <Folder className="size-3.5 shrink-0" />
      )}
      <span className="truncate max-w-[200px]" title={resourceName ?? resourceId}>
        {displayName}
      </span>
      <ExternalLink className="size-3 shrink-0 opacity-60" />
    </Link>
  );
}

function formatAction(action: string): string {
  return action
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function formatDuration(from: string, to: string): string {
  const a = new Date(from).getTime();
  const b = new Date(to).getTime();
  const ms = Math.max(0, b - a);
  if (ms < 1000) return "< 1s";
  const sec = Math.floor(ms / 1000);
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  const s = sec % 60;
  if (min < 60) return s > 0 ? `${min}m ${s}s` : `${min}m`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (m > 0) return `${h}h ${m}m`;
  return `${h}h`;
}

export default function VisitorEventsPage() {
  const params = useParams();
  const id = params.id as string;
  const visitorId = params.visitorId as string;
  const [data, setData] = useState<VisitorEventsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/shares/${id}/visitors/${visitorId}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [id, visitorId]);

  if (loading || !data) {
    return (
      <div className="p-6">
        {loading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : (
          <p className="text-destructive">Visitor or share not found.</p>
        )}
      </div>
    );
  }

  const { share, visitor, actions } = data;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/shares/${id}`}>
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">Visitor events</h1>
          <p className="text-muted-foreground text-sm">
            {share.title} · /share/{share.slug}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Visitor</CardTitle>
          <CardDescription>
            Fingerprint, location, first/last seen.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <span className="font-mono text-muted-foreground">
              {visitor.fingerprintHash.slice(0, 16)}…
            </span>
            {visitor.country && (
              <span>{visitor.country}{visitor.region ? `, ${visitor.region}` : ""}</span>
            )}
            {visitor.ip && (
              <span className="font-mono text-muted-foreground">{visitor.ip}</span>
            )}
          </div>
          <p className="text-muted-foreground">
            {new Date(visitor.firstSeenAt).toLocaleString()}
            {" → "}
            {new Date(visitor.lastSeenAt).toLocaleString()}
          </p>
          {visitor.referrer && (
            <p className="text-muted-foreground truncate max-w-md">
              Referrer: {visitor.referrer}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Events</CardTitle>
          <CardDescription>
            Timeline of page views, file opens, downloads, and navigations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {actions.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No events yet.
            </p>
          ) : (
            <div className="relative pl-6">
              <ul className="space-y-0 list-none p-0 m-0">
                {actions.map((a, i) => (
                  <Fragment key={a.id}>
                    <li className="relative flex pb-0">
                      <span
                        className="absolute -left-3 top-1.5 size-2.5 shrink-0 rounded-full bg-primary border-2 border-background z-1"
                        aria-hidden
                      />
                      <div className="flex-1 min-w-0 pt-0.5 pb-1 pl-1">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span className="text-sm font-medium">{formatAction(a.action)}</span>
                          <ResourceLink
                            resourceType={a.resourceType}
                            resourceId={a.resourceId}
                            resourceName={a.resourceName}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {new Date(a.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </li>
                    {i < actions.length - 1 && (
                      <li
                        className="relative flex pl-0 min-h-8"
                        aria-hidden
                      >
                        <div className="absolute left-[5px] top-0 bottom-0 w-px bg-border" />
                        <div className="flex-1 flex items-center pl-4">
                          <span className="text-xs text-muted-foreground">
                            {formatDuration(a.createdAt, actions[i + 1].createdAt)}
                          </span>
                        </div>
                      </li>
                    )}
                  </Fragment>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

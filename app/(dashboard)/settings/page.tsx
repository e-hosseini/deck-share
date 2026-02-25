"use client";

import { useState, useEffect } from "react";
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
import { Plus, Trash2, KeyRound, Megaphone, Globe, BarChart3 } from "lucide-react";

type FooterLinkItem = { label: string; url: string };

export default function SettingsPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const [ctaTitle, setCtaTitle] = useState("");
  const [ctaDescription, setCtaDescription] = useState("");
  const [ctaLink, setCtaLink] = useState("");
  const [ctaLinkLabel, setCtaLinkLabel] = useState("");
  const [ctaLoading, setCtaLoading] = useState(false);
  const [ctaSuccess, setCtaSuccess] = useState(false);
  const [ctaError, setCtaError] = useState<string | null>(null);

  const [websiteTitle, setWebsiteTitle] = useState("");
  const [footerCopyright, setFooterCopyright] = useState("");
  const [footerLinks, setFooterLinks] = useState<FooterLinkItem[]>([]);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoLoading, setLogoLoading] = useState(false);
  const [siteLoading, setSiteLoading] = useState(false);
  const [siteSuccess, setSiteSuccess] = useState(false);
  const [siteError, setSiteError] = useState<string | null>(null);

  const [posthogProjectKey, setPosthogProjectKey] = useState("");
  const [posthogHost, setPosthogHost] = useState("");
  const [posthogLoading, setPosthogLoading] = useState(false);
  const [posthogSuccess, setPosthogSuccess] = useState(false);
  const [posthogError, setPosthogError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/settings/cta")
      .then((r) => r.json())
      .then((data) => {
        if (data.cta) {
          setCtaTitle(data.cta.title ?? "");
          setCtaDescription(data.cta.description ?? "");
          setCtaLink(data.cta.link ?? "");
          setCtaLinkLabel(data.cta.linkLabel ?? "");
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/settings/site")
      .then((r) => r.json())
      .then((data) => {
        setWebsiteTitle(data.websiteTitle ?? "");
        setFooterCopyright(data.footerCopyright ?? "");
        setFooterLinks(Array.isArray(data.footerLinks) ? data.footerLinks : []);
        setPosthogProjectKey(data.posthogProjectKey ?? "");
        setPosthogHost(data.posthogHost ?? "");
        setLogoUrl(data.logoUrl ?? null);
      })
      .catch(() => {});
  }, []);

  async function onCtaSubmit(e: React.FormEvent) {
    e.preventDefault();
    setCtaError(null);
    setCtaSuccess(false);
    setCtaLoading(true);
    try {
      const res = await fetch("/api/settings/cta", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: ctaTitle.trim() || null,
          description: ctaDescription.trim() || null,
          link: ctaLink.trim() || null,
          linkLabel: ctaLinkLabel.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCtaError(data.error ?? "Failed to save.");
        setCtaLoading(false);
        return;
      }
      setCtaSuccess(true);
    } catch {
      setCtaError("Something went wrong.");
    } finally {
      setCtaLoading(false);
    }
  }

  function addFooterLink() {
    setFooterLinks((prev) => [...prev, { label: "", url: "" }]);
  }

  function updateFooterLink(index: number, field: "label" | "url", value: string) {
    setFooterLinks((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    );
  }

  function removeFooterLink(index: number) {
    setFooterLinks((prev) => prev.filter((_, i) => i !== index));
  }

  async function onLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoLoading(true);
    try {
      const formData = new FormData();
      formData.set("logo", file);
      const res = await fetch("/api/settings/logo", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const data = await res.json();
        setSiteError(data.error ?? "Failed to upload logo.");
        return;
      }
      setLogoUrl(`/api/settings/logo?t=${Date.now()}`);
      setSiteError(null);
    } catch {
      setSiteError("Failed to upload logo.");
    } finally {
      setLogoLoading(false);
      e.target.value = "";
    }
  }

  async function onLogoRemove() {
    setLogoLoading(true);
    try {
      const res = await fetch("/api/settings/logo", { method: "DELETE" });
      if (!res.ok) return;
      setLogoUrl(null);
    } finally {
      setLogoLoading(false);
    }
  }

  async function onSiteSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSiteError(null);
    setSiteSuccess(false);
    setSiteLoading(true);
    try {
      const res = await fetch("/api/settings/site", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          websiteTitle: websiteTitle.trim() || null,
          footerCopyright: footerCopyright.trim() || null,
          footerLinks: footerLinks.filter((x) => x.label.trim() && x.url.trim()),
          posthogProjectKey: posthogProjectKey.trim() || null,
          posthogHost: posthogHost.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSiteError(data.error ?? "Failed to save.");
        setSiteLoading(false);
        return;
      }
      setFooterLinks(Array.isArray(data.footerLinks) ? data.footerLinks : []);
      setPosthogProjectKey(data.posthogProjectKey ?? "");
      setPosthogHost(data.posthogHost ?? "");
      setSiteSuccess(true);
    } catch {
      setSiteError("Something went wrong.");
    } finally {
      setSiteLoading(false);
    }
  }

  async function onPosthogSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPosthogError(null);
    setPosthogSuccess(false);
    setPosthogLoading(true);
    try {
      const res = await fetch("/api/settings/site", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          websiteTitle: websiteTitle.trim() || null,
          footerCopyright: footerCopyright.trim() || null,
          footerLinks: footerLinks.filter((x) => x.label.trim() && x.url.trim()),
          posthogProjectKey: posthogProjectKey.trim() || null,
          posthogHost: posthogHost.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPosthogError(data.error ?? "Failed to save.");
        setPosthogLoading(false);
        return;
      }
      setPosthogSuccess(true);
    } catch {
      setPosthogError("Something went wrong.");
    } finally {
      setPosthogLoading(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/settings/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to change password.");
        setLoading(false);
        return;
      }

      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col p-6">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your account and site configuration.
        </p>
      </header>

      <div className="container space-y-6">
       
      <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <Globe className="size-4 text-muted-foreground" />
              Website & footer
            </CardTitle>
            <CardDescription className="text-sm">
              Title, logo (favicon and share header), footer text and links.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={onSiteSubmit} className="space-y-6">
              {siteError && (
                <p className="text-sm text-destructive" role="alert">
                  {siteError}
                </p>
              )}
              {siteSuccess && (
                <p className="text-sm text-green-600 dark:text-green-500" role="status">
                  Website & footer saved.
                </p>
              )}
              <div className="space-y-2">
                <Label>Logo</Label>
                <p className="text-xs text-muted-foreground">
                  Favicon and share page header. PNG, JPEG, GIF, WebP or ICO.
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  {logoUrl && (
                    <div className="flex items-center gap-2">
                      <img
                        src={logoUrl}
                        alt="Site logo"
                        className="h-10 w-10 rounded-md border border-input object-contain bg-muted/30"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={onLogoRemove}
                        disabled={logoLoading}
                      >
                        Remove
                      </Button>
                    </div>
                  )}
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/gif,image/webp,.ico,image/x-icon,image/vnd.microsoft.icon"
                      className="sr-only"
                      onChange={onLogoChange}
                      disabled={logoLoading}
                    />
                    <span className="inline-flex items-center justify-center rounded-md border border-input bg-background px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground">
                      {logoLoading ? "Uploading…" : logoUrl ? "Change" : "Upload logo"}
                    </span>
                  </label>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-1">
                <div className="space-y-2">
                  <Label htmlFor="website-title">Website title</Label>
                  <Input
                    id="website-title"
                    value={websiteTitle}
                    onChange={(e) => setWebsiteTitle(e.target.value)}
                    placeholder="e.g. Deck Share"
                    disabled={siteLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="footer-copyright">Footer copyright</Label>
                  <textarea
                    id="footer-copyright"
                    value={footerCopyright}
                    onChange={(e) => setFooterCopyright(e.target.value)}
                    placeholder="e.g. © 2025 Company Name"
                    disabled={siteLoading}
                    rows={2}
                    className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Footer links</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addFooterLink}
                    disabled={siteLoading}
                  >
                    <Plus className="mr-1 size-4" />
                    Add link
                  </Button>
                </div>
                <div className="space-y-2">
                  {footerLinks.map((link, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={link.label}
                        onChange={(e) => updateFooterLink(index, "label", e.target.value)}
                        placeholder="Label"
                        disabled={siteLoading}
                        className="flex-1 min-w-0"
                      />
                      <Input
                        value={link.url}
                        onChange={(e) => updateFooterLink(index, "url", e.target.value)}
                        placeholder="https://…"
                        type="url"
                        disabled={siteLoading}
                        className="flex-1 min-w-0"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFooterLink(index)}
                        disabled={siteLoading}
                        className="shrink-0"
                        aria-label="Remove link"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
              <Button type="submit" disabled={siteLoading} size="sm">
                {siteLoading ? "Saving…" : "Save website & footer"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <Megaphone className="size-4 text-muted-foreground" />
              Call to action
            </CardTitle>
            <CardDescription className="text-sm">
              Button on share pages that opens a modal with a link.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onCtaSubmit} className="space-y-4">
              {ctaError && (
                <p className="text-sm text-destructive" role="alert">
                  {ctaError}
                </p>
              )}
              {ctaSuccess && (
                <p className="text-sm text-green-600 dark:text-green-500" role="status">
                  Call to action saved.
                </p>
              )}
              <div className="space-y-2">
                <Label htmlFor="cta-title">Button title</Label>
                <Input
                  id="cta-title"
                  value={ctaTitle}
                  onChange={(e) => setCtaTitle(e.target.value)}
                  placeholder="e.g. Sign up"
                  disabled={ctaLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cta-description">Modal description</Label>
                <textarea
                  id="cta-description"
                  value={ctaDescription}
                  onChange={(e) => setCtaDescription(e.target.value)}
                  placeholder="Short description…"
                  disabled={ctaLoading}
                  rows={3}
                  className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cta-link">Link URL</Label>
                <Input
                  id="cta-link"
                  type="url"
                  value={ctaLink}
                  onChange={(e) => setCtaLink(e.target.value)}
                  placeholder="https://…"
                  disabled={ctaLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cta-link-label">Link label (in modal)</Label>
                <Input
                  id="cta-link-label"
                  value={ctaLinkLabel}
                  onChange={(e) => setCtaLinkLabel(e.target.value)}
                  placeholder="e.g. Go to sign up"
                  disabled={ctaLoading}
                />
              </div>
              <Button type="submit" disabled={ctaLoading} size="sm">
                {ctaLoading ? "Saving…" : "Save"}
              </Button>
            </form>
          </CardContent>
        </Card>


        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="size-4 text-muted-foreground" />
              PostHog
            </CardTitle>
            <CardDescription className="text-sm">
              Analytics on share pages. Project API key and host.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onPosthogSubmit} className="space-y-4">
              {posthogError && (
                <p className="text-sm text-destructive" role="alert">
                  {posthogError}
                </p>
              )}
              {posthogSuccess && (
                <p className="text-sm text-green-600 dark:text-green-500" role="status">
                  PostHog settings saved.
                </p>
              )}
              <div className="space-y-2">
                <Label htmlFor="posthog-key">Project API key</Label>
                <Input
                  id="posthog-key"
                  type="password"
                  autoComplete="off"
                  value={posthogProjectKey}
                  onChange={(e) => setPosthogProjectKey(e.target.value)}
                  placeholder="phc_…"
                  disabled={posthogLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="posthog-host">Host</Label>
                <Input
                  id="posthog-host"
                  value={posthogHost}
                  onChange={(e) => setPosthogHost(e.target.value)}
                  placeholder="https://us.i.posthog.com"
                  disabled={posthogLoading}
                />
              </div>
              <Button type="submit" disabled={posthogLoading} size="sm">
                {posthogLoading ? "Saving…" : "Save PostHog"}
              </Button>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <KeyRound className="size-4 text-muted-foreground" />
              Change password
            </CardTitle>
            <CardDescription className="text-sm">
              Update your account password.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              {error && (
                <p className="text-sm text-destructive" role="alert">
                  {error}
                </p>
              )}
              {success && (
                <p className="text-sm text-green-600 dark:text-green-500" role="status">
                  Password updated successfully.
                </p>
              )}
              <div className="space-y-2">
                <Label htmlFor="current-password">Current password</Label>
                <Input
                  id="current-password"
                  type="password"
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">New password</Label>
                <Input
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm new password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  disabled={loading}
                />
              </div>
              <Button type="submit" disabled={loading} size="sm">
                {loading ? "Updating…" : "Update password"}
              </Button>
            </form>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}

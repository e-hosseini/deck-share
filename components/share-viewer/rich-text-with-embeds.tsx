"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * Renders HTML that may contain embeds with <script> and <link>.
 * Scripts injected via innerHTML do not run; this component re-inserts
 * scripts and link tags so they execute/load (e.g. Google Calendar embeds).
 */
export function RichTextWithEmbeds({
  html,
  className,
}: {
  html: string;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !html) return;

    const PROCESSED = "data-embeds-processed";
    const HTML_KEY = "data-embed-html";
    if (container.getAttribute(HTML_KEY) !== html) {
      container.removeAttribute(PROCESSED);
      container.setAttribute(HTML_KEY, html);
    }
    if (container.hasAttribute(PROCESSED)) return;

    const EXECUTED = "data-embed-executed";
    const scripts = container.querySelectorAll<HTMLScriptElement>(`script:not([${EXECUTED}])`);
    const scriptLoadPromises: Promise<void>[] = [];
    scripts.forEach((oldScript) => {
      const newScript = document.createElement("script");
      if (oldScript.src) {
        newScript.src = oldScript.src;
        scriptLoadPromises.push(
          new Promise((resolve) => {
            newScript.onload = () => resolve();
            newScript.onerror = () => resolve();
          })
        );
      } else {
        newScript.textContent = oldScript.textContent ?? "";
      }
      for (const attr of Array.from(oldScript.attributes)) {
        if (attr.name !== "src" && attr.name !== "type") continue;
        newScript.setAttribute(attr.name, attr.value);
      }
      if (oldScript.async) newScript.async = true;
      if (oldScript.defer) newScript.defer = true;
      newScript.setAttribute(EXECUTED, "true");
      oldScript.replaceWith(newScript);
    });

    const links = container.querySelectorAll('link[rel="stylesheet"]:not([data-embed-loaded])');
    links.forEach((link) => {
      const href = link.getAttribute("href");
      if (!href) return;
      if (document.querySelector(`link[href="${href}"]`)) return;
      const newLink = document.createElement("link");
      newLink.rel = "stylesheet";
      newLink.href = href;
      newLink.setAttribute("data-embed-loaded", "true");
      document.head.appendChild(newLink);
      link.remove();
    });

    if (document.readyState === "complete" && scripts.length > 0) {
      Promise.all(scriptLoadPromises).then(() => {
        window.dispatchEvent(new Event("load"));
      });
    }
    container.setAttribute(PROCESSED, "true");
  }, [html]);

  const proseClasses = [
    "max-w-none text-foreground",
    // Paragraphs
    "[&_p]:mb-4 [&_p:last-child]:mb-0",
    // Headings
    "[&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mt-6 [&_h1]:mb-3 [&_h1]:tracking-tight",
    "[&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mt-5 [&_h2]:mb-2 [&_h2]:tracking-tight",
    "[&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-2",
    "[&_h4]:text-base [&_h4]:font-semibold [&_h4]:mt-3 [&_h4]:mb-1",
    "[&_h5]:text-sm [&_h5]:font-semibold [&_h5]:mt-2 [&_h5]:mb-1",
    "[&_h6]:text-sm [&_h6]:font-medium [&_h6]:mt-2 [&_h6]:mb-1 [&_h6]:text-muted-foreground",
    // Lists
    "[&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-4 [&_ul]:space-y-1",
    "[&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-4 [&_ol]:space-y-1",
    "[&_li]:my-0.5 [&_li_ul]:my-1 [&_li_ol]:my-1",
    // Links
    "[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 [&_a]:hover:text-primary/90",
    // Inline text
    "[&_strong]:font-bold [&_b]:font-bold",
    "[&_em]:italic [&_i]:italic",
    "[&_s]:line-through [&_strike]:line-through",
    // Blockquote
    "[&_blockquote]:border-l-4 [&_blockquote]:border-primary/30 [&_blockquote]:pl-4 [&_blockquote]:my-4 [&_blockquote]:text-muted-foreground [&_blockquote]:italic",
    // Inline code
    "[&_code]:font-mono [&_code]:text-sm [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:before:content-none [&_code]:after:content-none",
    // Code block (pre > code from TipTap)
    "[&_pre]:my-4 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-muted [&_pre]:p-4 [&_pre]:text-sm",
    "[&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:rounded-none",
    // Horizontal rule
    "[&_hr]:my-6 [&_hr]:border-border",
    // Tables
    "[&_table]:w-full [&_table]:my-4 [&_table]:border-collapse [&_table]:border [&_table]:border-border",
    "[&_th]:border [&_th]:border-border [&_th]:bg-muted/50 [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:font-medium",
    "[&_td]:border [&_td]:border-border [&_td]:px-3 [&_td]:py-2",
    "[&_tr]:border-b [&_tr]:border-border last:[&_tr]:border-b-0",
  ].join(" ");

  return (
    <div
      ref={containerRef}
      className={cn(proseClasses, className)}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

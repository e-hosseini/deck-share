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

  return (
    <div
      ref={containerRef}
      className={cn(
        "prose prose-sm dark:prose-invert max-w-none [&_p]:mb-4 [&_p:last-child]:mb-0",
        className
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

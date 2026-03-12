import { Node, mergeAttributes } from "@tiptap/core";

export interface EmbedOptions {
  HTMLAttributes: Record<string, unknown>;
}

function extractEmbedHtml(element: HTMLElement): string {
  const dataHtml = element.getAttribute("data-html");
  if (dataHtml) return dataHtml;
  const iframe = element.querySelector("iframe");
  if (iframe) return iframe.outerHTML;
  return element.innerHTML || "";
}

export const EmbedExtension = Node.create<EmbedOptions>({
  name: "embed",

  group: "block",

  atom: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      html: {
        default: "",
        parseHTML: (element) => extractEmbedHtml(element as HTMLElement),
        renderHTML: (attributes) => {
          if (!attributes.html) return {};
          return {
            "data-html": attributes.html,
            class: "embed-block",
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[class*="embed-block"]',
        getAttrs: (dom) => {
          const el = dom as HTMLElement;
          const html = extractEmbedHtml(el);
          return html ? { html } : false;
        },
      },
      {
        tag: "iframe",
        getAttrs: (dom) => {
          const html = (dom as HTMLElement).outerHTML;
          return { html };
        },
      },
    ];
  },

  renderHTML({ node }) {
    return [
      "div",
      mergeAttributes(this.options.HTMLAttributes, {
        class: "embed-block",
        "data-html": node.attrs.html,
      }),
    ];
  },

  addNodeView() {
    return ({ node }) => {
      const dom = document.createElement("div");
      dom.className = "embed-block my-2 rounded-md overflow-hidden border border-input bg-muted/30";
      if (node.attrs.html) {
        dom.innerHTML = node.attrs.html;
      }
      return { dom };
    };
  },
});

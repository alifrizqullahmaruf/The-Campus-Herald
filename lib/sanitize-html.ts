import "server-only";
import sanitizeHtml from "sanitize-html";

// Article HTML is rendered as raw HTML (components/article/article-body.tsx), so every body
// goes through here: when it is saved (Phase 4 Server Actions) and again when it is
// rendered, which also covers rows written outside the app (seed, direct SQL). Plan:
// docs/plans/2026-11-17-fase-4-alur-kerja.md, day 1.
//
// The allowlist is exactly what the editor can produce (components/editor/rich-text-editor.tsx:
// StarterKit without code, code blocks, strike, underline, rules and links, plus images).
// Change both together. Server-only: the library (with postcss and htmlparser2) is large,
// and the browser never needs it.

const ALLOWED_TAGS = ["p", "h2", "h3", "strong", "em", "ul", "ol", "li", "blockquote", "br", "img"];

/** https:// anywhere, or a path on this site ("/uploads/…"); never "//host" or "/\host". */
const SAFE_IMAGE_SRC = /^(?:https:\/\/[^\s]+|\/(?![/\\])[^\s]*)$/i;
const LIST_START = /^[1-9]\d{0,5}$/;
const LIST_TYPES = new Set(["1", "a", "A", "i", "I"]);

const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: ALLOWED_TAGS,
  // A list pasted from Word or Docs keeps its letter or Roman numbering (Tiptap writes `type`).
  allowedAttributes: { img: ["src", "alt", "title"], ol: ["start", "type"] },
  allowedClasses: {},
  allowedStyles: {},
  // Only images carry a URL, and only https (relative paths have no scheme to check).
  allowedSchemes: [],
  allowedSchemesByTag: { img: ["https"] },
  allowedSchemesAppliedToAttributes: ["src"],
  allowProtocolRelative: false,
  disallowedTagsMode: "discard",
  // Dropped with their content, not just the tags: the library's defaults plus the tags
  // whose content is never article text (it would show up as escaped markup).
  nonTextTags: [
    "script", "style", "textarea", "option", "noscript", "template", "title",
    "iframe", "xmp", "noembed", "noframes", "plaintext",
  ],
  transformTags: {
    // For HTML posted straight to a Server Action rather than typed in the editor.
    b: "strong",
    i: "em",
    h1: "h2",
    h4: "h3",
    h5: "h3",
    h6: "h3",
    img: (tagName, attribs) => {
      const src = attribs.src?.trim() ?? "";
      const { alt, title } = attribs;
      return {
        tagName,
        attribs: {
          ...(SAFE_IMAGE_SRC.test(src) ? { src } : {}),
          ...(alt !== undefined ? { alt } : {}),
          ...(title !== undefined ? { title } : {}),
        },
      };
    },
    ol: (tagName, attribs) => {
      const start = attribs.start ?? "";
      const kept: sanitizeHtml.Attributes = LIST_START.test(start) ? { start } : {};
      if (LIST_TYPES.has(attribs.type ?? "")) kept.type = attribs.type;
      return { tagName, attribs: kept };
    },
  },
  // An image whose address was not allowed is dropped rather than left empty.
  exclusiveFilter: (frame) => frame.tag === "img" && !frame.attribs.src,
};

/**
 * Article HTML with only the tags and attributes the editor makes: no scripts, event
 * handlers, styles, links or other tags (their text stays; script and style content does
 * not), images only from https or this site. Safe to run more than once.
 */
export function sanitizeArticleHtml(html: string): string {
  return sanitizeHtml(html, OPTIONS);
}

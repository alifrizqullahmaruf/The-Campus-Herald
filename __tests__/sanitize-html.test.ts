// @vitest-environment node
import { describe, expect, test } from "vitest";
import { BODIES } from "../lib/mock/bodies";
import { sanitizeArticleHtml as clean } from "../lib/sanitize-html";

// Article HTML is rendered raw, so this is the XSS barrier (Phase 4, day 1,
// docs/plans/2026-11-17-fase-4-alur-kerja.md).

/** Nothing that can run script, load from elsewhere or restyle the page is left. */
function expectHarmless(html: string) {
  expect(html).not.toMatch(/<\s*(script|style|iframe|svg|math|object|embed|a|form|input|noscript|template)\b/i);
  expect(html).not.toMatch(/\son\w+\s*=/i);
  expect(html).not.toMatch(/javascript:|vbscript:|data:|blob:/i);
  expect(html).not.toMatch(/\s(style|class|id|srcset|href)\s*=/i);
}

const ATTACKS: Record<string, string> = {
  "a script tag": '<p>a<script>alert(1)</script>b</p>',
  "an onerror handler": "<img src=x onerror=alert(1)>",
  "an onerror handler on an allowed image": '<img src="https://img.test/a.jpg" onerror="alert(1)">',
  "a javascript: image": '<img src="javascript:alert(1)">',
  "a javascript: image hidden with an entity": '<img src="jav&#x09;ascript:alert(1)">',
  "a javascript: image hidden with a colon entity": '<img src="javascript&#58;alert(1)">',
  "a javascript: image in capitals with spaces": '<img src="  JaVaScRiPt:alert(1)">',
  "a data: image": '<img src="data:image/svg+xml;base64,PHN2Zz4=">',
  "a blob: image": '<img src="blob:https://site.test/1">',
  "an http image": '<img src="http://img.test/a.jpg">',
  "a protocol-relative image": '<img src="//evil.test/a.jpg">',
  "a backslash protocol-relative image": '<img src="/\\evil.test/a.jpg">',
  "an svg with onload": "<svg onload=alert(1)><p>t</p></svg>",
  "math markup": '<math><mtext><img src=x onerror=alert(1)></mtext></math>',
  "an iframe": '<iframe src="https://evil.test"></iframe>',
  "a javascript: link": '<a href="javascript:alert(1)">link</a>',
  "style and event attributes": '<p style="background:url(x)" onclick="alert(1)" class="x" id="y">t</p>',
  "a style tag": "<style>body{display:none}</style><p>t</p>",
  "a nested script tag": "<scr<script>ipt>alert(1)</script>",
  "a comment that splits a tag": "<!--><img src=x onerror=alert(1)>-->",
  "mutation XSS through noscript": '<noscript><p title="</noscript><img src=x onerror=alert(1)>"></p></noscript>',
  "an ol start with a handler": '<ol start="1 onclick=alert(1)"><li><p>a</p></li></ol>',
  "a form": '<form action="https://evil.test"><input name="password"></form>',
  "a srcset": '<img src="https://img.test/a.jpg" srcset="javascript:alert(1) 1x">',
  "a tab entity inside a protocol-relative path": '<img src="/&#9;/evil.test/a.jpg">',
  "a newline entity inside a protocol-relative path": '<img src="/&#10;/evil.test/a.jpg">',
  "a space before a protocol-relative path": '<img src="&#32;//evil.test/a.jpg">',
  "upper-case tags and handlers": '<IMG SRC="https://img.test/a.jpg" ONERROR="alert(1)"><SCRIPT>alert(1)</SCRIPT>',
  "a second src": '<img src="https://img.test/a.jpg" src="javascript:alert(1)">',
  "a textarea breakout": '<textarea><p title="</textarea><img src=x onerror=alert(1)>"></p></textarea>',
  "an iframe breakout": '<iframe><p title="</iframe><img src=x onerror=alert(1)>"></p></iframe>',
  "an image with alt but no src": '<img alt="x" onerror="alert(1)">',
  "an ol type with a handler": '<ol type="a onclick=alert(1)"><li>a</li></ol>',
};

describe("sanitizeArticleHtml", () => {
  for (const [name, html] of Object.entries(ATTACKS)) {
    test(`removes ${name}`, () => {
      const output = clean(html);
      expectHarmless(output);
      expect(clean(output)).toBe(output);
    });
  }

  test("keeps the text of removed tags, but not script or style content", () => {
    expect(clean('<p>a<script>alert(1)</script>b</p>')).toBe("<p>ab</p>");
    expect(clean('<a href="javascript:alert(1)">read more</a>')).toBe("read more");
    expect(clean("<style>p{}</style><p>t</p>")).toBe("<p>t</p>");
    expect(clean("<xmp><img src=x onerror=1></xmp><p>t</p>")).toBe("<p>t</p>");
    expect(clean('<p style="color:red" onclick="x">t</p>')).toBe("<p>t</p>");
  });

  test("keeps what the editor makes", () => {
    const editor =
      "<h2>Heading</h2><h3>Sub</h3><p>Text with <strong>bold</strong>, <em>italic</em> and a<br />break.</p>" +
      "<ul><li><p>one</p></li><li><p>two</p></li></ul><ol start=\"3\"><li><p>three</p></li></ol>" +
      "<blockquote><p>Pull quote</p></blockquote>" +
      '<img src="https://images.unsplash.com/photo-1?w=800" alt="A desk" title="Desk" />' +
      '<img src="/uploads/2026/cover.webp" alt="" />';
    expect(clean(editor)).toBe(editor);
  });

  test("images only from https or this site; anything else is dropped", () => {
    expect(clean('<img src="https://img.test/a.jpg">')).toBe('<img src="https://img.test/a.jpg" />');
    expect(clean('<img src="/covers/a.webp">')).toBe('<img src="/covers/a.webp" />');
    for (const src of ["//evil.test/a.jpg", "/\\evil.test/a.jpg", "http://img.test/a.jpg", "a.jpg", "", "https://"]) {
      expect(clean(`<p>a</p><img src="${src}" alt="x">`)).toBe("<p>a</p>");
    }
  });

  test("turns tags the editor does not have into the nearest one it has", () => {
    expect(clean("<h1>H</h1><h4>h</h4><h6>h</h6><b>b</b><i>i</i>")).toBe(
      "<h2>H</h2><h3>h</h3><h3>h</h3><strong>b</strong><em>i</em>",
    );
    expect(clean('<ol start="0"><li>a</li></ol><ol start="-2"><li>b</li></ol>')).toBe("<ol><li>a</li></ol><ol><li>b</li></ol>");
    expect(clean('<ol type="i" start="2"><li>a</li></ol><ol type="x"><li>b</li></ol>')).toBe(
      '<ol start="2" type="i"><li>a</li></ol><ol><li>b</li></ol>',
    );
  });

  test("escapes text, so markup written as text stays text", () => {
    expect(clean("<p>1 &lt; 2 &amp; &lt;script&gt;</p>")).toBe("<p>1 &lt; 2 &amp; &lt;script&gt;</p>");
    expect(clean('<img src="https://img.test/a.jpg" alt="&quot; onerror=&quot;alert(1)">')).toBe(
      '<img src="https://img.test/a.jpg" alt="&quot; onerror=&quot;alert(1)" />',
    );
  });

  test("leaves every sample article exactly as it is", () => {
    for (const body of Object.values(BODIES)) expect(clean(body)).toBe(body);
  });
});

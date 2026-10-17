import { ImageResponse } from "next/og";
import { MARK_SVG } from "@/lib/brand-mark";
import { SITE } from "@/lib/site";

// Link preview image for social apps and chat (docs/design.md 0, Brand).
export const alt = `${SITE.name}, a community blog by ${SITE.parent}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const markSrc = `data:image/svg+xml;base64,${Buffer.from(MARK_SVG).toString("base64")}`;

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          gap: 56,
          padding: 80,
          background: "#F5EFE6",
          color: "#111111",
          borderBottom: "24px solid #F9DE43",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse renders plain img */}
        <img src={markSrc} width={415} height={300} alt="" />
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 96, fontWeight: 900, letterSpacing: -3, lineHeight: 1 }}>{SITE.name}</div>
          {/* One text node per div: ImageResponse requires flex for multiple children. */}
          <div style={{ marginTop: 16, fontSize: 32, color: "#4A4640" }}>{`by ${SITE.parent}`}</div>
          <div style={{ marginTop: 40, fontSize: 36, fontWeight: 700 }}>{SITE.tagline}</div>
        </div>
      </div>
    ),
    size,
  );
}

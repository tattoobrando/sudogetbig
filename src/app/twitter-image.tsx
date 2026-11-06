import type { ReactNode } from "react";
import { ImageResponse } from "next/og";

export const alt = "sudo get big — ROOT ACCESS TO GAINS.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function TwitterImage() {
  const line = (children: ReactNode, color = "#dfe6e1") => (
    <div style={{ display: "flex", color, fontSize: 26, lineHeight: 1.5 }}>{children}</div>
  );
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0a0c0b",
          padding: "64px 72px",
          fontFamily: "monospace",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          {line(<span>$ sudo get big</span>, "#3dff8c")}
          {line(<span>[sudo] password for gains: ********</span>, "#8a968e")}
          {line(<span>[ OK ] Mounting /dev/delts...</span>)}
          {line(<span>[ OK ] Disabling excuses.service...</span>)}
          {line(<span>WARNING: leg_day.service has not been started.</span>, "#ffb547")}
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 104, fontWeight: 900, color: "#dfe6e1", letterSpacing: -3, lineHeight: 1 }}>
            ROOT ACCESS TO
          </div>
          <div style={{ display: "flex", fontSize: 104, fontWeight: 900, color: "#3dff8c", letterSpacing: -3, lineHeight: 1.05 }}>
            GAINS.
          </div>
          <div style={{ display: "flex", marginTop: 24, fontSize: 28, color: "#8a968e" }}>sudogetbig.com · calves not supported</div>
        </div>
      </div>
    ),
    size,
  );
}

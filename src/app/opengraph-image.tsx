import { ImageResponse } from "next/og";

export const alt = "India Observed — independent, source-linked civic records";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        alignItems: "flex-start",
        background: "#ffffff",
        border: "28px solid #151616",
        color: "#151616",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        justifyContent: "space-between",
        padding: "64px",
        width: "100%",
      }}
    >
      <div style={{ color: "#d33a22", fontSize: 30, fontWeight: 800 }}>INDIA OBSERVED</div>
      <div style={{ display: "flex", fontSize: 72, fontWeight: 800, maxWidth: 900 }}>
        Independent records of protests and civic movements across India.
      </div>
      <div style={{ fontSize: 28 }}>
        Sources linked · Identities protected · Corrections visible
      </div>
    </div>,
    size,
  );
}

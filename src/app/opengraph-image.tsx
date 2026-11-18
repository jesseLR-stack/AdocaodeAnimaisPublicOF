import { ImageResponse } from "next/og";

export const alt = "AdoteAmigo — Uma nova história começa com uma adoção.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#fbf6ec", padding: 72, fontFamily: "serif" }}>
        <div style={{ position: "absolute", right: -120, top: -120, width: 520, height: 520, borderRadius: 9999, background: "#c8d7c1", display: "flex" }} />
        <div style={{ position: "absolute", right: 140, bottom: -160, width: 420, height: 420, borderRadius: 9999, background: "#f9d0b0", display: "flex" }} />
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: "100%" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <svg width="88" height="88" viewBox="0 0 40 40">
              <rect width="40" height="40" rx="13" fill="#4f6a49" />
              <path d="M9.5 19.2 19 11.3a1.6 1.6 0 0 1 2 0l9.5 7.9" fill="none" stroke="#fbf6ec" strokeWidth="2.6" strokeLinecap="round" />
              <path d="M12.5 17.5v10a2.5 2.5 0 0 0 2.5 2.5h10a2.5 2.5 0 0 0 2.5-2.5v-10" fill="none" stroke="#fbf6ec" strokeWidth="2.6" strokeLinecap="round" />
              <path d="M20 27.2s-4.6-2.7-4.6-5.8a2.4 2.4 0 0 1 4.6-1 2.4 2.4 0 0 1 4.6 1c0 3.1-4.6 5.8-4.6 5.8Z" fill="#f3b183" />
            </svg>
            <div style={{ display: "flex", fontSize: 56, fontWeight: 700, color: "#3f543b" }}>
              Adote<span style={{ color: "#dd7a3d" }}>Amigo</span>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", maxWidth: 820 }}>
            <div style={{ fontSize: 76, lineHeight: 1.05, fontWeight: 700, color: "#1f2a1e" }}>Uma nova história começa com uma adoção.</div>
            <div style={{ marginTop: 24, fontSize: 32, color: "#4f6a49", fontFamily: "sans-serif" }}>
              Cães, gatos e outros animais esperando um lar em todo o Brasil.
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}

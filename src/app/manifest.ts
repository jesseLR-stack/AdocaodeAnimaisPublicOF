import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AdoteAmigo — Adoção responsável de animais",
    short_name: "AdoteAmigo",
    description: "Uma nova história começa com uma adoção.",
    start_url: "/",
    display: "standalone",
    background_color: "#fbf6ec",
    theme_color: "#4f6a49",
    lang: "pt-BR",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}

import { cn } from "@/lib/utils";

const PALETTES = [
  { bg: "#e3ebdf", fur: "#d8b48a", dark: "#8a6544", accent: "#f3b183" },
  { bg: "#fde9da", fur: "#a8a29e", dark: "#57534e", accent: "#f9d0b0" },
  { bg: "#f5ecdb", fur: "#e9c49a", dark: "#9a6b3f", accent: "#a6bd9c" },
  { bg: "#e8eef3", fur: "#3f3f46", dark: "#18181b", accent: "#f3b183" },
  { bg: "#f3f6f1", fur: "#f4e3c9", dark: "#b89c74", accent: "#ec935a" },
];

function hash(value: string) {
  let h = 0;
  for (let i = 0; i < value.length; i++) h = (h * 31 + value.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/**
 * Ilustração própria usada quando o anúncio ainda não tem foto.
 * A cor varia de forma determinística pelo nome do animal.
 */
export function AnimalIllustration({
  species,
  seed = "",
  className,
}: {
  species: "cachorro" | "gato" | "outro";
  seed?: string;
  className?: string;
}) {
  const p = PALETTES[hash(seed) % PALETTES.length]!;
  return (
    <svg viewBox="0 0 200 200" className={cn("size-full", className)} role="img" aria-label="Ilustração do animal">
      <rect width="200" height="200" fill={p.bg} />
      <circle cx="160" cy="40" r="46" fill={p.accent} opacity="0.35" />
      <circle cx="30" cy="175" r="38" fill="#ffffff" opacity="0.5" />
      {species === "gato" ? (
        <g>
          <path d="M58 82 66 38l30 30Z" fill={p.fur} />
          <path d="M142 82l-8-44-30 30Z" fill={p.fur} />
          <path d="M66 74 69 52l15 15Z" fill={p.accent} opacity="0.8" />
          <path d="M134 74l-3-22-15 15Z" fill={p.accent} opacity="0.8" />
          <ellipse cx="100" cy="110" rx="52" ry="46" fill={p.fur} />
          <ellipse cx="80" cy="104" rx="6" ry="8" fill={p.dark} />
          <ellipse cx="120" cy="104" rx="6" ry="8" fill={p.dark} />
          <circle cx="82" cy="101" r="2" fill="#fff" />
          <circle cx="122" cy="101" r="2" fill="#fff" />
          <path d="M94 120h12l-6 7Z" fill={p.accent} />
          <path d="M100 127c-3 6-9 7-13 4M100 127c3 6 9 7 13 4" stroke={p.dark} strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M58 118H34M60 126l-22 6M142 118h24M140 126l22 6" stroke={p.dark} strokeWidth="2" strokeLinecap="round" opacity="0.5" />
        </g>
      ) : species === "cachorro" ? (
        <g>
          <ellipse cx="100" cy="108" rx="50" ry="48" fill={p.fur} />
          <path d="M54 76c-16 6-22 40-10 56 8 10 18-4 20-24Z" fill={p.dark} />
          <path d="M146 76c16 6 22 40 10 56-8 10-18-4-20-24Z" fill={p.dark} />
          <ellipse cx="100" cy="130" rx="26" ry="20" fill="#fff" opacity="0.75" />
          <ellipse cx="82" cy="102" rx="6" ry="7" fill={p.dark} />
          <ellipse cx="118" cy="102" rx="6" ry="7" fill={p.dark} />
          <circle cx="84" cy="99" r="2" fill="#fff" />
          <circle cx="120" cy="99" r="2" fill="#fff" />
          <ellipse cx="100" cy="122" rx="9" ry="6.5" fill={p.dark} />
          <path d="M100 128v6m0 0c-4 5-10 4-12 1m12-1c4 5 10 4 12 1" stroke={p.dark} strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M96 140q4 10 8 0" fill={p.accent} />
        </g>
      ) : (
        <g>
          <ellipse cx="100" cy="118" rx="44" ry="40" fill={p.fur} />
          <ellipse cx="80" cy="62" rx="12" ry="30" fill={p.fur} transform="rotate(-12 80 62)" />
          <ellipse cx="120" cy="62" rx="12" ry="30" fill={p.fur} transform="rotate(12 120 62)" />
          <ellipse cx="80" cy="64" rx="5" ry="20" fill={p.accent} opacity="0.7" transform="rotate(-12 80 64)" />
          <ellipse cx="120" cy="64" rx="5" ry="20" fill={p.accent} opacity="0.7" transform="rotate(12 120 64)" />
          <circle cx="86" cy="112" r="5.5" fill={p.dark} />
          <circle cx="114" cy="112" r="5.5" fill={p.dark} />
          <path d="M96 126h8l-4 5Z" fill={p.accent} />
          <path d="M100 131c-2 4-6 5-9 3M100 131c2 4 6 5 9 3" stroke={p.dark} strokeWidth="2.2" fill="none" strokeLinecap="round" />
        </g>
      )}
    </svg>
  );
}

import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";

/**
 * Turuncu-kırmızı marka gradyanının SVG tanımı.
 * Aynı `id`, o bölümdeki <GradyenIkon gradyanId="..."> ikonlarına verilir.
 */
export function GradyanTanimi({ id }: { id: string }) {
  return (
    <svg aria-hidden="true" className="pointer-events-none absolute h-0 w-0">
      <defs>
        <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F97316" />
          <stop offset="100%" stopColor="#EF4444" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/** FontAwesome ikonunu marka gradyanıyla boyayarak çizer. */
export default function GradyenIkon({
  icon,
  className = "h-4 w-4",
  gradyanId,
}: {
  icon: IconDefinition;
  className?: string;
  gradyanId: string;
}) {
  const [genislik, yukseklik, , , yollar] = icon.icon;
  const yolListesi = Array.isArray(yollar) ? yollar : [yollar];

  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox={`0 0 ${genislik} ${yukseklik}`}
      className={className}
    >
      {yolListesi.map((yol, idx) => (
        <path key={idx} d={yol} fill={`url(#${gradyanId})`} />
      ))}
    </svg>
  );
}

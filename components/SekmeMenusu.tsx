"use client";

import { useId } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import GradyenIkon, { GradyanTanimi } from "@/components/ui/GradyenIkon";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";

export interface Sekme<T extends string = string> {
  id: T;
  etiket: string;
  ikon: IconDefinition;
}

interface SekmeMenusuProps<T extends string> {
  /** Görünüme özel sekmeler (`/destek`: 4, `/`: 3). */
  sekmeler: readonly Sekme<T>[];
  aktifSekme: T;
  setAktifSekme: (sekme: T) => void;
}

export default function SekmeMenusu<T extends string>({
  sekmeler,
  aktifSekme,
  setAktifSekme,
}: SekmeMenusuProps<T>) {
  const benzersizId = useId().replace(/:/g, "");
  const gradyanId = `sekme-gradyan-${benzersizId}`;

  return (
    <nav aria-label="Ana bölümler" className="w-full border-b border-gray-200/80">
      <GradyanTanimi id={gradyanId} />

      {/* Kartsız, doğrudan zemin üzerinde minimalist sekmeler */}
      <div
        role="tablist"
        aria-label="Ana bölümler"
        className="grid gap-1"
        style={{
          gridTemplateColumns: `repeat(${sekmeler.length}, minmax(0, 1fr))`,
        }}
      >
        {sekmeler.map((sekme) => {
          const aktif = aktifSekme === sekme.id;

          return (
            <button
              key={sekme.id}
              type="button"
              role="tab"
              aria-selected={aktif}
              onClick={() => setAktifSekme(sekme.id)}
              className={`ui-focus relative flex cursor-pointer flex-col items-center justify-center gap-1.5 pb-2.5 pt-1.5 transition-colors ${
                aktif
                  ? "text-gray-900"
                  : "text-gray-500 hover:text-gray-600"
              }`}
            >
              {aktif ? (
                <GradyenIkon
                  icon={sekme.ikon}
                  className="h-4 w-4"
                  gradyanId={gradyanId}
                />
              ) : (
                <FontAwesomeIcon icon={sekme.ikon} className="text-sm text-gray-500" />
              )}

              <span
                className={`text-[11px] leading-tight tracking-tight sm:text-xs ${
                  aktif ? "font-bold text-gray-900" : "font-medium text-gray-500"
                }`}
              >
                {sekme.etiket}
              </span>

              {aktif && (
                <span
                  aria-hidden="true"
                  className="absolute inset-x-2 bottom-0 h-[3px] rounded-t-full bg-gradient-to-r from-orange-500 to-red-500"
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";

/**
 * Bağımlılıksız sürükle-bırak sıralama. Pointer events kullandığı için mouse,
 * dokunmatik ekran ve kalemle aynı şekilde çalışır; tutamak ok tuşlarıyla da
 * taşınabilir.
 *
 * - `liste`: dikey liste (kartlar). Kaydırma alanının kenarına yaklaşınca
 *   sayfa/pencere otomatik kayar.
 * - `izgara`: eşit boyutlu hücrelerden oluşan ızgara (medya önizlemeleri).
 *
 * Dokunmatik ekranda sayfanın kaydırılabilmesi için sürükleme yalnızca
 * `data-tutamak` özniteliği taşıyan (ve `touch-none` sınıflı) öğeden başlar;
 * mouse ile `tumOge` seçeneği verilirse öğenin tamamından tutulabilir.
 */

type Mod = "liste" | "izgara";
type Kutu = { x: number; y: number; w: number; h: number };
type Durum = { from: number; to: number; dx: number; dy: number; kutular: Kutu[] };

type Oturum = {
  pointerId: number;
  from: number;
  to: number;
  baslangicX: number;
  baslangicY: number;
  sonX: number;
  sonY: number;
  aktif: boolean;
  kutular: Kutu[];
  kaydirici: HTMLElement | null;
  kaydirmaBaslangic: number;
  raf: number;
};

const ESIK = 4;
const KENAR = 64;
const GECIS = "transform 220ms cubic-bezier(0.2, 0.8, 0.2, 1)";

export function diziTasi<T>(dizi: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= dizi.length || to >= dizi.length) {
    return dizi;
  }
  const yeni = [...dizi];
  const [oge] = yeni.splice(from, 1);
  yeni.splice(to, 0, oge);
  return yeni;
}

function kaydiriciBul(el: HTMLElement | null): HTMLElement | null {
  for (let p = el?.parentElement ?? null; p; p = p.parentElement) {
    const tasma = getComputedStyle(p).overflowY;
    if ((tasma === "auto" || tasma === "scroll") && p.scrollHeight > p.clientHeight) return p;
  }
  return null;
}

function kaydirmaKonumu(kaydirici: HTMLElement | null) {
  return kaydirici ? kaydirici.scrollTop : window.scrollY;
}

/** Pointer kaydırma alanının kenarına yaklaştıkça alanı kaydırır (rAF döngüsü). */
function otomatikKaydir(o: Oturum, hesapla: () => void) {
  if (!o.aktif) return;
  const alan = o.kaydirici?.getBoundingClientRect();
  const ust = alan ? alan.top : 0;
  const alt = alan ? alan.bottom : window.innerHeight;
  let hiz = 0;
  if (o.sonY < ust + KENAR) hiz = -Math.ceil(((ust + KENAR - o.sonY) / KENAR) * 14);
  else if (o.sonY > alt - KENAR) hiz = Math.ceil(((o.sonY - (alt - KENAR)) / KENAR) * 14);
  if (hiz !== 0) {
    if (o.kaydirici) o.kaydirici.scrollTop += hiz;
    else window.scrollBy(0, hiz);
    hesapla();
  }
  o.raf = requestAnimationFrame(() => otomatikKaydir(o, hesapla));
}

export function useSiralama({
  adet,
  mod,
  tasi,
  devreDisi = false,
}: {
  adet: number;
  mod: Mod;
  tasi: (from: number, to: number) => void;
  devreDisi?: boolean;
}) {
  const ogeler = useRef<(HTMLElement | null)[]>([]);
  const oturum = useRef<Oturum | null>(null);
  const [durum, setDurum] = useState<Durum | null>(null);

  const hesapla = useCallback(() => {
    const o = oturum.current;
    if (!o || !o.aktif) return;
    const dx = mod === "liste" ? 0 : o.sonX - o.baslangicX;
    const dy = o.sonY - o.baslangicY + (kaydirmaKonumu(o.kaydirici) - o.kaydirmaBaslangic);
    const b = o.kutular[o.from];
    const cx = b.x + b.w / 2 + dx;
    const cy = b.y + b.h / 2 + dy;

    let to = 0;
    if (mod === "liste") {
      o.kutular.forEach((k, i) => {
        if (i !== o.from && k.y + k.h / 2 < cy) to++;
      });
    } else {
      let enYakin = Infinity;
      o.kutular.forEach((k, i) => {
        const mesafe = Math.hypot(k.x + k.w / 2 - cx, k.y + k.h / 2 - cy);
        if (mesafe < enYakin) {
          enYakin = mesafe;
          to = i;
        }
      });
    }
    o.to = to;
    setDurum({ from: o.from, to, dx, dy, kutular: o.kutular });
  }, [mod]);

  const bitir = useCallback(
    (uygula: boolean) => {
      const o = oturum.current;
      oturum.current = null;
      if (!o) return;
      cancelAnimationFrame(o.raf);
      if (o.aktif) {
        if (uygula && o.to !== o.from) tasi(o.from, o.to);
        setDurum(null);
      }
    },
    [tasi]
  );

  useEffect(
    () => () => {
      if (oturum.current) cancelAnimationFrame(oturum.current.raf);
    },
    []
  );

  /** Sıralanan her öğenin köküne yayılır (ref + kaydırma stili). */
  const ogeProps = (index: number) => {
    let style: CSSProperties | undefined;
    if (durum) {
      const { from, to, dx, dy, kutular } = durum;
      if (index === from) {
        style = { transform: `translate3d(${dx}px, ${dy}px, 0)`, zIndex: 30, position: "relative" };
      } else {
        let yeni = index;
        if (from < to && index > from && index <= to) yeni = index - 1;
        if (from > to && index >= to && index < from) yeni = index + 1;
        let x = 0;
        let y = 0;
        if (yeni !== index) {
          if (mod === "izgara") {
            x = kutular[yeni].x - kutular[index].x;
            y = kutular[yeni].y - kutular[index].y;
          } else {
            const bosluk =
              kutular.length > 1 ? kutular[1].y - (kutular[0].y + kutular[0].h) : 0;
            const kayma = kutular[from].h + bosluk;
            y = from < to ? -kayma : kayma;
          }
        }
        style = { transform: `translate3d(${x}px, ${y}px, 0)`, transition: GECIS, position: "relative" };
      }
    }
    return {
      ref: (el: HTMLElement | null) => {
        ogeler.current[index] = el;
      },
      style,
    };
  };

  /**
   * Tutamağa (veya `tumOge` ile öğenin köküne) yayılan olay dinleyicileri.
   * `tumOge`: mouse ile öğenin her yerinden tutulabilir; dokunmada yine
   * yalnızca `data-tutamak` öğesinden başlar.
   */
  const tutamakProps = (index: number, { tumOge = false }: { tumOge?: boolean } = {}) => ({
    onPointerDown: (e: ReactPointerEvent<HTMLElement>) => {
      if (devreDisi || oturum.current || adet < 2) return;
      if (e.pointerType === "mouse" && e.button !== 0) return;
      const hedef = e.target as Element;
      const tutamakta = Boolean(hedef.closest("[data-tutamak]"));
      if (!tutamakta) {
        if (!tumOge || e.pointerType !== "mouse") return;
        if (hedef.closest("button, a, input, textarea, select, video[controls]")) return;
      }
      e.currentTarget.setPointerCapture(e.pointerId);
      if (e.pointerType === "mouse") e.preventDefault();
      oturum.current = {
        pointerId: e.pointerId,
        from: index,
        to: index,
        baslangicX: e.clientX,
        baslangicY: e.clientY,
        sonX: e.clientX,
        sonY: e.clientY,
        aktif: false,
        kutular: [],
        kaydirici: null,
        kaydirmaBaslangic: 0,
        raf: 0,
      };
    },
    onPointerMove: (e: ReactPointerEvent<HTMLElement>) => {
      const o = oturum.current;
      if (!o || o.pointerId !== e.pointerId) return;
      o.sonX = e.clientX;
      o.sonY = e.clientY;
      if (!o.aktif) {
        if (Math.hypot(o.sonX - o.baslangicX, o.sonY - o.baslangicY) < ESIK) return;
        const kutular: Kutu[] = [];
        for (let i = 0; i < adet; i++) {
          const r = ogeler.current[i]?.getBoundingClientRect();
          kutular.push(r ? { x: r.left, y: r.top, w: r.width, h: r.height } : { x: 0, y: 0, w: 0, h: 0 });
        }
        o.kutular = kutular;
        o.kaydirici = kaydiriciBul(ogeler.current[o.from] ?? null);
        o.kaydirmaBaslangic = kaydirmaKonumu(o.kaydirici);
        o.aktif = true;
        o.raf = requestAnimationFrame(() => otomatikKaydir(o, hesapla));
      }
      hesapla();
    },
    onPointerUp: (e: ReactPointerEvent<HTMLElement>) => {
      if (oturum.current?.pointerId === e.pointerId) bitir(true);
    },
    onPointerCancel: (e: ReactPointerEvent<HTMLElement>) => {
      if (oturum.current?.pointerId === e.pointerId) bitir(false);
    },
    onKeyDown: (e: ReactKeyboardEvent<HTMLElement>) => {
      if (devreDisi || !(e.target as Element).hasAttribute("data-tutamak")) return;
      const geri = e.key === "ArrowUp" || e.key === "ArrowLeft";
      const ileri = e.key === "ArrowDown" || e.key === "ArrowRight";
      if (!geri && !ileri) return;
      e.preventDefault();
      const hedef = index + (geri ? -1 : 1);
      if (hedef >= 0 && hedef < adet) tasi(index, hedef);
    },
  });

  return { suruklenen: durum?.from ?? null, ogeProps, tutamakProps };
}

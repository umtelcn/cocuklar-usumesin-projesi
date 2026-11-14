/**
 * Metni panoya kopyalar; başarılıysa true döner.
 * navigator.clipboard yoksa (ör. HTTP üzerinden açılan sayfa) veya reddedilirse
 * gizli bir textarea + execCommand ile yedek yöntemi dener.
 */
export async function panoyaKopyala(metin: string): Promise<boolean> {
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(metin);
      return true;
    }
  } catch {
    // yedek yönteme düş
  }

  try {
    const alan = document.createElement("textarea");
    alan.value = metin;
    alan.setAttribute("readonly", "");
    alan.style.position = "fixed";
    alan.style.top = "0";
    alan.style.left = "0";
    alan.style.opacity = "0";
    document.body.appendChild(alan);
    alan.select();
    alan.setSelectionRange(0, metin.length);
    const basarili = document.execCommand("copy");
    document.body.removeChild(alan);
    return basarili;
  } catch {
    return false;
  }
}

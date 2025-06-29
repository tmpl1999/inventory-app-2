/**
 * General-purpose helpers.
 * Flesh them out as your app grows – they only need to exist for the build.
 */

/* ────────────────────────────────────────────────────────────── */
/*  JSON downloader                                              */
/* ────────────────────────────────────────────────────────────── */
export function downloadJsonAsFile<T>(
  data: T,
  filename = 'export.json'
): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a   = document.createElement('a');
  a.href      = url;
  a.download   = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/* ────────────────────────────────────────────────────────────── */
/*  Date helpers – now accept undefined too                      */
/* ────────────────────────────────────────────────────────────── */

/** "29/06/2025, 13:42" (returns empty string if date is falsy) */
export function formatDateTime(date?: Date | string): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString();
}

/** "2025-06-29" (returns empty string if date is falsy) */
export function formatDate(date?: Date | string): string {
  if (!date) return '';
  return new Date(date).toLocaleDateString('sv-SE');
}


/* ────────────────────────────────────────────────────────────── */
/*  Tailwind class-name helper                                   */
/* ────────────────────────────────────────────────────────────── */
export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}


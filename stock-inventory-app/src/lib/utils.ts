/**
 * General-purpose helpers used by multiple pages / components.
 * Flesh them out as needed – they only need to exist for the build.
 */

/* ---------- JSON downloader ------------------------------------ */
export function downloadJsonAsFileT<T>(
  data: T,
  filename = 'export.json'
): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a   = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/* ---------- Date helpers --------------------------------------- */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString();
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('sv-SE'); // e.g. 2025-06-29
}

/* ---------- Tailwind class-name helper ------------------------- */
export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

/**
 * General-purpose helpers that several pages expect.
 * You can improve them later – for now they just work.
 */

export function downloadJsonAsFile<T>(
  data: T,
  filename = 'export.json',
): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString();      // tweak to taste
}
/**
 * Tailwind helper – concatenate class-names while ignoring falsy values.
 *   cn('p-2', isActive && 'bg-red-500')  ➜  "p-2 bg-red-500"
 */
export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

/** Short “YYYY-MM-DD” format if you ever need it. */
export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString();
}

/* keep your existing downloadJsonAsFile() and formatDateTime() above */

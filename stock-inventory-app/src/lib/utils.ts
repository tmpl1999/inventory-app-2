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

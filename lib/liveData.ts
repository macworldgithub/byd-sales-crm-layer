// Missing merge values stay explicit; never invent a name, vehicle, time or VIN.
export function fillSavedTemplate(
  body: string,
  values: Record<string, string | undefined>
) {
  return body.replace(
    /\{\{\s*([\w]+)\s*\}\}/g,
    (placeholder, key) => values[key] || placeholder
  );
}
export const measured = (value: number | null | undefined, suffix = '') =>
  typeof value === 'number' && Number.isFinite(value)
    ? `${value.toLocaleString()}${suffix}`
    : '—';

export function recordedTotal(values: Array<number | null | undefined>) {
  return values.every(value => typeof value === 'number' && Number.isFinite(value))
    ? values.reduce<number>((sum, value) => sum + value!, 0)
    : null;
}

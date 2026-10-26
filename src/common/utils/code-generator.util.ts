export function generateReferenceCode(prefix: string): string {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const datePart = `${yyyy}${mm}${dd}`;
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);

  return `${prefix}-${datePart}-${randomSuffix}`;
}

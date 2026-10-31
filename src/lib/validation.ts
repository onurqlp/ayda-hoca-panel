const turkishMap: Record<string, string> = {
  ç: 'c', ğ: 'g', ı: 'i', İ: 'i', ö: 'o', ş: 's', ü: 'u',
}

export function normalizeName(value: string): string {
  return value
    .toLocaleLowerCase('tr-TR')
    .replace(/[çğıİöşü]/g, (letter) => turkishMap[letter] ?? letter)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
}

export function isLikelyDuplicateName(left: string, right: string): boolean {
  return normalizeName(left) === normalizeName(right)
}

export function validateTurkishIban(value: string): { valid: boolean; normalized: string } {
  const normalized = value.replace(/\s+/g, '').toUpperCase()
  if (!normalized) return { valid: true, normalized }
  if (!/^TR\d{24}$/.test(normalized)) return { valid: false, normalized }

  const rearranged = normalized.slice(4) + normalized.slice(0, 4)
  const numeric = rearranged
    .split('')
    .map((char) => (/[A-Z]/.test(char) ? String(char.charCodeAt(0) - 55) : char))
    .join('')
  let remainder = 0
  for (const digit of numeric) remainder = (remainder * 10 + Number(digit)) % 97
  return { valid: remainder === 1, normalized }
}

export function formatIban(value: string): string {
  return value.replace(/\s+/g, '').replace(/(.{4})/g, '$1 ').trim()
}

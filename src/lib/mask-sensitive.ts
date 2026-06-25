export const maskAccountNumber = (value: string | null | undefined): string | null => {
  if (!value) return null;
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 4) return digits;
  return `****${digits.slice(-4)}`;
};

export const maskCardNumber = (value: string | null | undefined): string | null => {
  if (!value) return null;
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 4) return digits;
  return `**** **** **** ${digits.slice(-4)}`;
};

/** Returns true when the value looks like a masked display string, not a real number. */
export const isMaskedSensitiveValue = (value: string | null | undefined): boolean => {
  if (!value) return false;
  return value.includes('*');
};

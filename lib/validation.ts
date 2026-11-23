export function shippingFormDataIsValid(
  data: Record<string, any> | FormData,
): boolean {
  const requiredFields = [
    'fullName',
    'streetLine1',
    'city',
    'postalCode',
    'countryCode',
  ];
  const read = (key: string): unknown =>
    data instanceof FormData ? data.get(key) : data[key];
  return requiredFields.every((field) => {
    const v = read(field);
    return v != null && String(v).trim() !== '';
  });
}

export function replaceEmptyString(value: string | null | undefined): string {
  return value && value.trim() !== '' ? value : '-';
}

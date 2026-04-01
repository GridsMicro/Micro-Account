export function roundThaiTaxAmount(amount: number) {
  return Number((Math.round((Number(amount) + Number.EPSILON) * 100) / 100).toFixed(2));
}

export const money = (n: number | null | undefined) => {
  if (n == null) return 'Price not available';
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
};
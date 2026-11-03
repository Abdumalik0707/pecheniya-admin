// Two price lists: ordinary customers ("individual") and shop / wholesale
// customers ("shop"). The shop price is set per product in the admin panel;
// when a product has no shop price yet, it defaults to the ordinary price
// plus SHOP_MARKUP, rounded up to the nearest 100 so'm.
//
// Keep this file in sync with "pecheniya/site/lib/pricing.ts".

export const SHOP_MARKUP = 0.1; // +10%

export type PriceCustomerType = "individual" | "shop";

export function defaultShopPrice(price: number): number {
  // round first: 82000 * 1.1 is 90200.00000000001 in floating point
  return Math.ceil(Math.round(price * (1 + SHOP_MARKUP)) / 100) * 100;
}

export function shopPriceOf(p: { price: number; shopPrice?: number | null }): number {
  return p.shopPrice && p.shopPrice > 0 ? p.shopPrice : defaultShopPrice(p.price);
}

export function priceFor(
  p: { price: number; shopPrice?: number | null },
  type?: string | null
): number {
  return type === "shop" ? shopPriceOf(p) : p.price;
}

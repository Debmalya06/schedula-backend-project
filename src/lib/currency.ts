const USD_TO_INR_RATE = 83;

export function usdToInr(amount: number) {
  return amount * USD_TO_INR_RATE;
}

export function formatInrFromUsd(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(usdToInr(amount));
}

import { Decimal } from "decimal.js";

const Q192 = BigInt(2) ** BigInt(192);


export function sqrtPriceX96ToTokenPrices(
  sqrtPriceX96: bigint,
  token0Decimals: number,
  token1Decimals: number,
): Decimal[] {
  const priceX96 =  sqrtPriceX96 * sqrtPriceX96
  const num = new Decimal((priceX96).toString());
  const denom = new Decimal(Q192.toString());
  
  const price1 = num
    .div(denom)
    .times(exponentToBigDecimal(token0Decimals))
    .div(exponentToBigDecimal(token1Decimals));

  const price0 = safeDiv(new Decimal(1), price1);
  return [price0, price1];
}

// Helper functions
function exponentToBigDecimal(decimals: number): Decimal {
  return new Decimal(10).pow(decimals);
}

function safeDiv(numerator: Decimal, denominator: Decimal): Decimal {
  return denominator.eq(0) ? new Decimal(0) : numerator.div(denominator);
}
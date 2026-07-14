# Utilities

Utility modules are pure domain and formatting code. Wallet/network orchestration belongs in hooks; reusable rendering belongs in components.

## Purchase

`purchaseSwap.ts` validates USDC amounts and fees, derives the configured Uniswap v4 pool, calculates slippage bounds, checks exact allowance readiness, and encodes Universal Router commands. It depends on runtime Uniswap SDK packages because encoding runs in the browser.

## Shipping

`shippingRedemption.ts` canonicalizes selected inventory, converts units to exact token base amounts, serializes the encrypted payload, creates short-lived EIP-2612 typed data, and splits signatures for the batch-redeemer ABI.

Do not add logs for shipping data, encrypted payloads, token permits, signatures, payment amounts, or complete wallet/provider errors.

## Wallet errors

`walletErrors.ts` maps recognized wallet and contract failures to bounded user-facing messages. Unknown provider objects and raw transaction requests are intentionally not serialized or exposed.

`TransactionStatus` in `src/components` is the shared pending/success/error presentation for purchase, shipping, and admin operations.

## Address and pricing helpers

- `address.ts` truncates display addresses.
- `blockExplorer.ts` resolves links only from supported chain configuration.
- `formatCurrency.ts` formats decimal display values.
- `sqrtPricex96ToPrice.ts` converts Uniswap v4 slot data into token prices.

Run utility tests through `yarn test`; run static checks with `yarn lint` and `yarn typecheck`.

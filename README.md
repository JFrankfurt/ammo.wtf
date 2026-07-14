# ammo.wtf

React storefront for purchasing tokenized ammunition and redeeming token
balances for shipment. The current application and contract configuration are
Sepolia-only.

## Architecture

- Vite and React provide the browser application and route shell.
- wagmi, viem, RainbowKit, and TanStack Query provide wallet and chain access.
- `src/addresses.ts` is the source of truth for supported chains, deployed
  addresses, token metadata, decimals, and Uniswap v4 pool parameters.
- `src/hooks/useSepoliaPurchase.ts` owns quote, allowance, swap, receipt, and
  balance-refresh behavior for purchases.
- `src/hooks/useShippingRedemption.ts` owns payload encryption, EIP-2612 permit
  signing, batch redemption, and receipt handling for shipping.
- `src/components/TransactionStatus.tsx` presents pending, success, error, and
  explorer-link feedback for purchase, shipping, and admin transactions.
- `src/components/admin/` contains factory and token write forms. Frontend
  visibility is only a convenience; deployed contracts remain the authority
  for ownership and write authorization.
- Contract ABIs in `src/abi/` are generated from the sibling
  `ammo.wtf-contracts` Foundry project.

## Setup

Requirements:

- Node.js 20 (see `.nvmrc`)
- Yarn 1.22.22
- Foundry only when regenerating ABIs or working with contracts

```sh
nvm use
yarn install
yarn dev
```

Vite serves the app locally. No production deployment is required for local
development.

## Sepolia configuration

Only Sepolia (`11155111`) is enabled. Reads and writes must resolve through
`src/addresses.ts`; unsupported chains are rejected before transaction
submission. Update that file after a verified deployment rather than
scattering addresses through components.

`ammoBatchRedeemer` is intentionally optional. Shipping stays disabled until a
verified redeemer address is configured. Purchase also depends on configured
USDC, Permit2, Universal Router, v4 Quoter, PoolManager, StateView, and pool
parameters.

## Purchase flow

Purchases use an exact-input Sepolia Uniswap v4 swap:

1. Parse USDC subtotal and add the configured 10% purchase fee.
2. Quote total USDC input against the configured v4 pool.
3. Set exact ERC-20 and Permit2 allowances when existing allowances are
   insufficient or stale.
4. Encode and submit the Universal Router v4 swap with slippage protection and
   a deadline.
5. Wait for a successful receipt and refresh relevant balances.

The Uniswap SDK packages used by `src/utils/purchaseSwap.ts` are runtime
dependencies and must remain available to the browser build.

## Shipping flow

Shipping converts selected product units to exact token base amounts, validates
the US destination, encrypts shipping details for the shipper, signs one
EIP-2612 permit per token, and submits one `AmmoBatchRedeemer.redeem`
transaction. Permit signatures and plaintext shipping details must never be
logged. The hook exposes only sanitized user-facing failures.

The encrypted payload has a contract-size limit. Shipping availability also
requires a configured batch redeemer and Sepolia public client.

## ABI generation

With `ammo.wtf-contracts` checked out beside this repository:

```sh
yarn generate:abis
```

The script runs `forge build` and replaces the generated factory, token, and
batch-redeemer ABI modules. For a different checkout:

```sh
AMMO_CONTRACTS_DIR=/absolute/path/to/ammo.wtf-contracts yarn generate:abis
```

Do not hand-edit generated ABI files.

## Verification

```sh
yarn lint
yarn test
yarn typecheck
yarn build
```

Vitest and Testing Library cover validation, purchase encoding/readiness, and
shipping redemption helpers and presentation.

## Deployment

`yarn build` writes the static site to `dist/`; `yarn preview` serves that build
locally. `yarn deploy` publishes `dist/` through `gh-pages` and does not deploy
contracts.

Deploy and verify contracts from `ammo.wtf-contracts`, regenerate ABIs, then
update verified Sepolia addresses before building this frontend. Never commit
private keys, RPC credentials, wallet secrets, permit signatures, or plaintext
shipping data.

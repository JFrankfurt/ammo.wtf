# ammo.wtf

React storefront for purchasing tokenized ammunition and redeeming token
balances for shipment. Sepolia and Base are supported chains; the app
contracts are live on Sepolia, while Base stays feature-disabled until its
contracts and pools are deployed.

## Architecture

- Vite and React provide the browser application and route shell.
- wagmi, viem, RainbowKit, and TanStack Query provide wallet and chain access.
- `src/addresses.ts` is the source of truth for supported chains, deployed
  addresses, token metadata, decimals, and Uniswap v4 pool parameters.
- `src/hooks/usePurchase.ts` owns quote, allowance, swap, receipt, and
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

## Chain configuration

Sepolia (`11155111`) and Base (`8453`) are enabled. Reads and writes must
resolve through `src/addresses.ts`; unsupported chains are rejected before
transaction submission. Update that file after a verified deployment rather
than scattering addresses through components.

`ammoFactory` and `ammoBatchRedeemer` are intentionally optional per chain.
Shipping stays disabled until a verified redeemer address is configured, and
admin factory writes fail with a clear error where the factory is undeployed.
Purchase also depends on configured USDC, Permit2, Universal Router, v4
Quoter, PoolManager, StateView, and pool parameters.

Base launch checklist (`TODO(base-launch)` markers in `src/addresses.ts`):

1. Deploy and verify the factory, tokens, and batch redeemer from
   `ammo.wtf-contracts` on Base.
2. Create and seed the Uniswap v4 USDC/token pools.
3. Fill in `BASE_CONFIG` contract addresses and the Base token list.
4. Flip `DEFAULT_CHAIN_ID` to `base.id` and list Base first in `src/wagmi.ts`.

Set `VITE_BASE_RPC_URL` in `.env.local` for a dedicated Base RPC provider;
the app falls back to the public RPC when unset. Never commit RPC URLs with
embedded credentials.

## Purchase flow

Purchases use an exact-input Uniswap v4 swap on the connected chain:

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
requires a configured batch redeemer and a public client for the connected
chain.

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
update verified chain addresses before building this frontend. Never commit
private keys, RPC credentials, wallet secrets, permit signatures, or plaintext
shipping data.

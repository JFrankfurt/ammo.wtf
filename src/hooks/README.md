# About this project

We use Base as our mainnet, and Sepolia (not Base Sepolia) as our testnet

## Purpose

This project implements a redemption interface for AmmoTokens, allowing users to convert their tokens into physical ammunition that will be shipped to them. While it utilizes Uniswap V4 for the token mechanics, its primary purpose is to facilitate the redemption process, not general trading.

## Key Components

### Hooks

- `useUniswap.ts` - Core hook that handles the token redemption process
  - Manages redemption state (loading, errors, quotes, transactions)
  - Converts AmmoTokens to redemption credits
  - Handles the Universal Router SDK for token processing

### Components

- `UniswapSwap.tsx` - Main redemption interface component
  - Designed as a checkout-like experience
  - Only requires USDC amount input from the user
  - Includes shipping & handling fees (10% of purchase amount)
  - Displays order summary with subtotal, fees, and total
  - Shows estimated delivery timeframe
  - Provides expected token output
  - Includes terms and conditions
  - Network-aware transaction tracking

## Implementation Patterns

- Uses wagmi hooks for wallet connectivity
- Leverages Uniswap's infrastructure for secure token redemption
- Implements comprehensive error handling for failed redemptions
- Maintains detailed transaction records for shipping fulfillment
- Separates token mechanics from shipping logistics
- Token-specific interface with minimal user input required
- Checkout-like experience familiar to e-commerce users

## Configuration

Critical contract and configuration files:

- `src/addresses.ts` - AmmoToken and router contract addresses
- `src/abi/` - Smart contract interfaces
- Supports Base mainnet for production and Sepolia testnet for development (not Base Sepolia!)

## Important Note

This interface is specifically designed for AmmoToken redemption and shipping coordination. It is not intended for general token trading or swaps. Users should ensure compliance with all applicable regulations regarding ammunition purchases and shipping.

## Usage

To use the UniswapSwap component:

```tsx
import { UniswapSwap } from "../components/UniswapSwap";
import { TEST_556_TOKEN_ADDRESS } from "../addresses";

function MyPage() {
  const chainId = 11155111; // Sepolia
  const tokenInfo = TEST_556_TOKEN_ADDRESS[chainId];

  return (
    <UniswapSwap
      tokenAddress={tokenInfo.address}
      tokenName={tokenInfo.name}
      tokenSymbol={tokenInfo.symbol}
    />
  );
}
```

This will render a checkout-like interface for purchasing the specific token with USDC, including shipping fees and delivery information.

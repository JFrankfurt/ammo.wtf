# Utility Functions

## Wallet Error Handling

The wallet error handling utilities provide a standardized way to handle and display errors from wallet interactions throughout the application.

### Components

- `WalletErrorDisplay`: A reusable component for displaying wallet errors in a user-friendly format.
- `SimpleTransactionStatus`: Updated to use the new error handling utilities.
- `TransactionStates`: Updated to use the new error handling utilities.

### Utilities

- `parseWalletError`: Parses a wallet error message into a more user-friendly format.
- `formatWalletError`: Formats a wallet error for display in the UI.

### Hooks

- `useWalletErrorHandler`: A hook for handling wallet errors in a standardized way across the application.

### Usage

#### Using the WalletErrorDisplay component

```tsx
import { WalletErrorDisplay } from "../components/WalletErrorDisplay";

// In your component
return <div>{error && <WalletErrorDisplay error={error} />}</div>;
```

#### Using the useWalletErrorHandler hook

```tsx
import { useWalletErrorHandler } from '../hooks/useWalletErrorHandler';

function MyComponent() {
  const { error, isUserRejection, handleError, clearError } = useWalletErrorHandler();

  const handleTransaction = async () => {
    try {
      // Attempt transaction
      await walletClient.writeContract({...});
    } catch (err) {
      // Handle error
      handleError(err);
    }
  };

  return (
    <div>
      <button onClick={handleTransaction}>Submit Transaction</button>
      {error && <WalletErrorDisplay error={error} />}
      {isUserRejection && <p>You can try again when you're ready.</p>}
    </div>
  );
}
```

### Error Types Handled

The error handling utilities can identify and provide user-friendly messages for the following types of errors:

1. User rejection errors (e.g., "User denied transaction signature")
2. Insufficient funds errors
3. Gas-related errors
4. Nonce errors
5. Contract execution errors
6. MetaMask-specific errors

For unrecognized errors, a generic message is displayed with the option to view more details.

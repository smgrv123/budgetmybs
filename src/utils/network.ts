import * as Network from 'expo-network';

const POLL_INTERVAL_MS = 3000; // 3 seconds

/**
 * Custom error class for network-related issues
 */
export class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NetworkError';
  }
}

/**
 * Check if device has an active internet connection
 * @returns true if connected, false otherwise
 */
export const checkNetworkConnection = async (): Promise<boolean> => {
  const networkState = await Network.getNetworkStateAsync();
  return networkState.isConnected === true && networkState.isInternetReachable === true;
};

/**
 * Options for {@link pollNetworkConnection}.
 */
type PollNetworkConnectionOptions = {
  /**
   * When provided, polling continues past the first disconnect instead of stopping,
   * and this callback fires once on the offline → online transition.
   */
  onReconnect?: () => void;
  /** Poll interval in ms. Defaults to 3 seconds. */
  intervalMs?: number;
};

/**
 * Poll network connection.
 *
 * Without `options.onReconnect`, this is a one-shot watch: it polls until the first
 * observed disconnect, calls `onDisconnect`, then stops.
 *
 * With `options.onReconnect`, polling continues indefinitely: `onDisconnect` fires
 * once when connectivity is first lost, and `onReconnect` fires once when connectivity
 * returns after having been lost.
 *
 * @param onDisconnect - Callback when network is lost
 * @param options - Optional reconnect callback and interval override
 * @returns Cleanup function to stop polling
 */
export const pollNetworkConnection = (
  onDisconnect: () => void,
  options?: PollNetworkConnectionOptions
): (() => void) => {
  let isPolling = true;
  const intervalMs = options?.intervalMs ?? POLL_INTERVAL_MS;
  const onReconnect = options?.onReconnect;
  let wasOffline = false;

  const poll = async () => {
    while (isPolling) {
      const isConnected = await checkNetworkConnection();
      if (!isConnected && isPolling) {
        if (!onReconnect) {
          onDisconnect();
          break;
        }
        if (!wasOffline) {
          wasOffline = true;
          onDisconnect();
        }
      } else if (wasOffline && onReconnect) {
        wasOffline = false;
        onReconnect();
      }
      // Wait before next poll
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
  };

  // Start polling
  poll();

  // Return cleanup function
  return () => {
    isPolling = false;
  };
};

/**
 * Ensure network is available, throw NetworkError if not
 * @throws NetworkError if no internet connection
 */
export const ensureNetworkAvailable = async (): Promise<void> => {
  const isConnected = await checkNetworkConnection();
  if (!isConnected) {
    throw new NetworkError('No internet connection');
  }
};

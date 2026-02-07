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
 * Poll network connection every 3 seconds
 * @param onDisconnect - Callback when network is lost
 * @returns Cleanup function to stop polling
 */
export const pollNetworkConnection = (onDisconnect: () => void): (() => void) => {
  let isPolling = true;

  const poll = async () => {
    while (isPolling) {
      const isConnected = await checkNetworkConnection();
      if (!isConnected && isPolling) {
        onDisconnect();
        break;
      }
      // Wait before next poll
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
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

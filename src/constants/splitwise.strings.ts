/**
 * All user-facing strings for the Splitwise integration.
 */

export const SPLITWISE_STRINGS = {
  // Section / Card
  integrationsTitle: 'Integrations',
  cardTitle: 'Splitwise',
  cardDescription: 'Connect your Splitwise account to track shared expenses.',
  connectedLabel: 'Connected',
  disconnectedLabel: 'Not connected',

  // Buttons
  connectButton: 'Connect Splitwise',
  disconnectButton: 'Disconnect',
  reconnectButton: 'Reconnect Splitwise',

  // Status messages
  connectingLabel: 'Connecting…',
  reconnectRequired: 'Session expired. Please reconnect your Splitwise account.',

  // Errors
  connectFailedTitle: 'Connection failed',
  connectFailedBody: 'Could not connect to Splitwise. Please try again.',
  disconnectFailedTitle: 'Disconnect failed',
  disconnectFailedBody: 'Could not disconnect from Splitwise. Please try again.',
  authCancelledMessage: 'Splitwise connection was cancelled.',

  // Chat intents
  chatConnectTitle: 'Connect Splitwise',
  chatConnectSuccess: 'Your Splitwise account is now connected.',
  chatConnectFailure: 'Failed to connect to Splitwise.',
  chatConnectCancelled: 'Splitwise connection was cancelled.',

  chatDisconnectTitle: 'Disconnect Splitwise',
  chatDisconnectSuccess: 'Your Splitwise account has been disconnected.',
  chatDisconnectFailure: 'Failed to disconnect from Splitwise.',
  chatDisconnectCancelled: 'Splitwise disconnect was cancelled.',
} as const;

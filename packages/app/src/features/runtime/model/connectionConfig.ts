import {
  readConfiguredServerAuthTokenInput,
  readConfiguredServerEndpointInput,
  saveStoredServerAuthTokenInput,
  saveStoredServerEndpointInput,
} from '../../../utils/serverConfigSource';

export function loadServerEndpoint(): string {
  return readConfiguredServerEndpointInput() ?? '';
}

export function saveServerEndpoint(value: string): string {
  return saveStoredServerEndpointInput(value);
}

export function loadServerAuthToken(): string {
  return readConfiguredServerAuthTokenInput() ?? '';
}

export function saveServerAuthToken(value: string): string {
  return saveStoredServerAuthTokenInput(value);
}

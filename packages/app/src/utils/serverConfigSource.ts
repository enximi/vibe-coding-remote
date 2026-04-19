import {
  SERVER_AUTH_TOKEN_QUERY_PARAM,
  SERVER_ENDPOINT_QUERY_PARAM,
} from '../constants/network';
import {
  SERVER_AUTH_TOKEN_STORAGE_KEY,
  SERVER_ENDPOINT_STORAGE_KEY,
} from '../constants/storage';

export function readConfiguredServerEndpointInput(): string | null {
  return (
    readPresetValue(SERVER_ENDPOINT_QUERY_PARAM) ?? readStoredValue(SERVER_ENDPOINT_STORAGE_KEY)
  );
}

export function readConfiguredServerAuthTokenInput(): string | null {
  return (
    readPresetValue(SERVER_AUTH_TOKEN_QUERY_PARAM) ??
    readStoredValue(SERVER_AUTH_TOKEN_STORAGE_KEY)
  );
}

export function saveStoredServerEndpointInput(value: string): string {
  return saveStoredValue(SERVER_ENDPOINT_STORAGE_KEY, value);
}

export function saveStoredServerAuthTokenInput(value: string): string {
  return saveStoredValue(SERVER_AUTH_TOKEN_STORAGE_KEY, value);
}

function saveStoredValue(name: string, value: string): string {
  const normalizedValue = value.trim();

  if (normalizedValue) {
    window.localStorage.setItem(name, normalizedValue);
  } else {
    window.localStorage.removeItem(name);
  }

  return normalizedValue;
}

function readPresetValue(name: string): string | null {
  const value = new URL(window.location.href).searchParams.get(name);
  return value?.trim() || null;
}

function readStoredValue(name: string): string | null {
  const value = window.localStorage.getItem(name);
  return value?.trim() || null;
}

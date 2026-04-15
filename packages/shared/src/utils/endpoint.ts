import {
  DEFAULT_ACTION_API_PATH,
  DEFAULT_AUTH_CHECK_API_PATH,
  SERVER_AUTH_TOKEN_QUERY_PARAM,
  SERVER_ENDPOINT_QUERY_PARAM,
} from '../constants/network';
import {
  SERVER_AUTH_TOKEN_STORAGE_KEY,
  SERVER_ENDPOINT_STORAGE_KEY,
} from '../constants/storage';

export function resolveConfiguredActionEndpoint(): string | null {
  const candidate =
    readPresetValue(SERVER_ENDPOINT_QUERY_PARAM) ??
    readStoredValue(SERVER_ENDPOINT_STORAGE_KEY);

  return candidate ? normalizeActionEndpoint(candidate) : null;
}

export function resolveConfiguredAuthCheckEndpoint(): string | null {
  const actionEndpoint = resolveConfiguredActionEndpoint();

  if (!actionEndpoint) {
    return null;
  }

  try {
    const url = new URL(actionEndpoint, window.location.href);
    url.pathname = normalizeAuthCheckPath(url.pathname);
    url.search = '';
    return url.toString();
  } catch {
    return actionEndpoint;
  }
}

export function resolveConfiguredAuthToken(): string | null {
  return (
    readPresetValue(SERVER_AUTH_TOKEN_QUERY_PARAM) ??
    readStoredValue(SERVER_AUTH_TOKEN_STORAGE_KEY)
  );
}

export function normalizeActionEndpoint(value: string): string {
  const normalized = normalizeEndpoint(value);

  if (!normalized) {
    return normalized;
  }

  try {
    const url = new URL(normalized, window.location.href);
    url.pathname = normalizeActionPath(url.pathname);
    url.search = '';
    return url.toString();
  } catch {
    return normalized;
  }
}

function normalizeEndpoint(value: string): string {
  return value.trim();
}

function normalizeActionPath(pathname: string): string {
  if (!pathname || pathname === '/') {
    return DEFAULT_ACTION_API_PATH;
  }

  if (pathname.endsWith(DEFAULT_ACTION_API_PATH)) {
    return pathname;
  }

  if (pathname.endsWith('/api')) {
    return `${pathname}/action`;
  }

  return pathname;
}

function normalizeAuthCheckPath(pathname: string): string {
  if (!pathname || pathname === '/') {
    return DEFAULT_AUTH_CHECK_API_PATH;
  }

  if (pathname.endsWith(DEFAULT_AUTH_CHECK_API_PATH)) {
    return pathname;
  }

  if (pathname.endsWith(DEFAULT_ACTION_API_PATH)) {
    return pathname.slice(0, pathname.length - DEFAULT_ACTION_API_PATH.length) + DEFAULT_AUTH_CHECK_API_PATH;
  }

  if (pathname.endsWith('/api')) {
    return `${pathname}/auth-check`;
  }

  return pathname;
}

function readPresetValue(name: string): string | null {
  const value = new URL(window.location.href).searchParams.get(name);
  return value?.trim() || null;
}

function readStoredValue(name: string): string | null {
  const value = window.localStorage.getItem(name);
  return value?.trim() || null;
}

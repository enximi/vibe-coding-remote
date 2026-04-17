import {
  DEFAULT_ACTION_API_PATH,
  DEFAULT_AUTH_CHECK_API_PATH,
  DEFAULT_CAPABILITIES_API_PATH,
  DEFAULT_HEALTHCHECK_PATH,
  SERVER_AUTH_TOKEN_QUERY_PARAM,
  SERVER_ENDPOINT_QUERY_PARAM,
} from '../constants/network';
import { SERVER_AUTH_TOKEN_STORAGE_KEY, SERVER_ENDPOINT_STORAGE_KEY } from '../constants/storage';

export function resolveConfiguredActionEndpoint(): string | null {
  const candidate =
    readPresetValue(SERVER_ENDPOINT_QUERY_PARAM) ?? readStoredValue(SERVER_ENDPOINT_STORAGE_KEY);

  return resolveActionEndpoint(candidate);
}

export function resolveConfiguredAuthCheckEndpoint(): string | null {
  const candidate =
    readPresetValue(SERVER_ENDPOINT_QUERY_PARAM) ?? readStoredValue(SERVER_ENDPOINT_STORAGE_KEY);

  return resolveAuthCheckEndpoint(candidate);
}

export function resolveConfiguredHealthcheckEndpoint(): string | null {
  const candidate =
    readPresetValue(SERVER_ENDPOINT_QUERY_PARAM) ?? readStoredValue(SERVER_ENDPOINT_STORAGE_KEY);

  return resolveHealthcheckEndpoint(candidate);
}

export function resolveConfiguredCapabilitiesEndpoint(): string | null {
  const candidate =
    readPresetValue(SERVER_ENDPOINT_QUERY_PARAM) ?? readStoredValue(SERVER_ENDPOINT_STORAGE_KEY);

  return resolveCapabilitiesEndpoint(candidate);
}

export function resolveConfiguredAuthToken(): string | null {
  return (
    readPresetValue(SERVER_AUTH_TOKEN_QUERY_PARAM) ?? readStoredValue(SERVER_AUTH_TOKEN_STORAGE_KEY)
  );
}

export function resolveActionEndpoint(value: string | null | undefined): string | null {
  const url = parseServerUrl(value);

  if (!url) {
    return null;
  }

  url.pathname = normalizeActionPath(url.pathname);
  url.search = '';
  url.hash = '';
  return url.toString();
}

export function resolveAuthCheckEndpoint(value: string | null | undefined): string | null {
  return resolveDerivedEndpoint(value, DEFAULT_AUTH_CHECK_API_PATH);
}

export function resolveHealthcheckEndpoint(value: string | null | undefined): string | null {
  return resolveDerivedEndpoint(value, DEFAULT_HEALTHCHECK_PATH);
}

export function resolveCapabilitiesEndpoint(value: string | null | undefined): string | null {
  return resolveDerivedEndpoint(value, DEFAULT_CAPABILITIES_API_PATH);
}

export function normalizeActionEndpoint(value: string): string | null {
  return resolveActionEndpoint(value);
}

function resolveDerivedEndpoint(
  value: string | null | undefined,
  targetPath:
    | typeof DEFAULT_AUTH_CHECK_API_PATH
    | typeof DEFAULT_CAPABILITIES_API_PATH
    | typeof DEFAULT_HEALTHCHECK_PATH,
): string | null {
  const actionEndpoint = resolveActionEndpoint(value);

  if (!actionEndpoint) {
    return null;
  }

  const url = new URL(actionEndpoint);
  const prefix = getActionBasePath(url.pathname);
  url.pathname = `${prefix}${targetPath}` || targetPath;
  return url.toString();
}

function parseServerUrl(value: string | null | undefined): URL | null {
  const normalizedInput = normalizeServerInput(value);

  if (!normalizedInput) {
    return null;
  }

  try {
    const url = new URL(normalizedInput);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return null;
    }

    if (!url.hostname) {
      return null;
    }

    return url;
  } catch {
    return null;
  }
}

function normalizeServerInput(value: string | null | undefined): string | null {
  const trimmed = value?.trim();

  if (!trimmed) {
    return null;
  }

  if (trimmed.startsWith('/') || trimmed.startsWith('.')) {
    return null;
  }

  if (hasAbsoluteScheme(trimmed)) {
    return trimmed;
  }

  return `http://${trimmed}`;
}

function hasAbsoluteScheme(value: string): boolean {
  return /^[a-z][a-z\d+\-.]*:\/\//i.test(value);
}

function normalizeActionPath(pathname: string): string {
  const basePath = trimTrailingSlash(pathname);

  if (!basePath || basePath === '/') {
    return DEFAULT_ACTION_API_PATH;
  }

  if (basePath.endsWith(DEFAULT_ACTION_API_PATH)) {
    return basePath;
  }

  if (basePath.endsWith(DEFAULT_AUTH_CHECK_API_PATH)) {
    return (
      basePath.slice(0, basePath.length - DEFAULT_AUTH_CHECK_API_PATH.length) +
      DEFAULT_ACTION_API_PATH
    );
  }

  if (basePath.endsWith(DEFAULT_CAPABILITIES_API_PATH)) {
    return (
      basePath.slice(0, basePath.length - DEFAULT_CAPABILITIES_API_PATH.length) +
      DEFAULT_ACTION_API_PATH
    );
  }

  if (basePath.endsWith(DEFAULT_HEALTHCHECK_PATH)) {
    return (
      basePath.slice(0, basePath.length - DEFAULT_HEALTHCHECK_PATH.length) + DEFAULT_ACTION_API_PATH
    );
  }

  if (basePath.endsWith('/api')) {
    return `${basePath}/action`;
  }

  return `${basePath}${DEFAULT_ACTION_API_PATH}`;
}

function getActionBasePath(pathname: string): string {
  const actionPath = normalizeActionPath(pathname);
  return actionPath.slice(0, actionPath.length - DEFAULT_ACTION_API_PATH.length);
}

function trimTrailingSlash(pathname: string): string {
  return pathname.replace(/\/+$/, '') || '/';
}

function readPresetValue(name: string): string | null {
  const value = new URL(window.location.href).searchParams.get(name);
  return value?.trim() || null;
}

function readStoredValue(name: string): string | null {
  const value = window.localStorage.getItem(name);
  return value?.trim() || null;
}

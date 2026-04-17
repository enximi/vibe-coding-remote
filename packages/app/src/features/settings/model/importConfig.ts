export type ParsedImportConfig = {
  endpoint: string;
  token: string;
};

export function parseImportUrl(rawValue: string): ParsedImportConfig | null {
  try {
    const url = new URL(rawValue.trim());
    if (url.protocol !== 'vibecodingremote:' || url.hostname !== 'import') {
      return null;
    }

    const endpoint = url.searchParams.get('endpoint')?.trim() ?? '';
    const compactEndpoint = url.searchParams.get('e')?.trim() ?? '';
    const token = url.searchParams.get('token')?.trim() ?? '';
    const compactToken = url.searchParams.get('t')?.trim() ?? '';
    const version = url.searchParams.get('v')?.trim() ?? '';
    const resolvedEndpoint = endpoint || compactEndpoint;
    const resolvedToken = token || compactToken;

    if (version !== '1' || !resolvedEndpoint || !resolvedToken) {
      return null;
    }

    return { endpoint: resolvedEndpoint, token: resolvedToken };
  } catch {
    return null;
  }
}

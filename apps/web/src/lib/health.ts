/** The only API capability active in the foundation milestone. */
export type ApiHealth = Readonly<{
  service: 'restaurantos-api';
  status: 'ok';
  version: 'v1';
}>;

export class HealthApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'HealthApiError';
  }
}

export function parseApiHealth(input: unknown): ApiHealth {
  if (typeof input !== 'object' || input === null) {
    throw new HealthApiError('Invalid health response');
  }

  const body = input as Record<string, unknown>;
  if (body.service !== 'restaurantos-api' || body.status !== 'ok' || body.version !== 'v1') {
    throw new HealthApiError('Unexpected health response');
  }
  return { service: 'restaurantos-api', status: 'ok', version: 'v1' };
}

export type FetchLike = (url: string, init: RequestInit) => Promise<Response>;

export async function getApiHealth(fetcher: FetchLike = fetch): Promise<ApiHealth> {
  let response: Response;
  try {
    response = await fetcher('/api/v1/health', {
      method: 'GET',
      headers: { Accept: 'application/json' },
      credentials: 'same-origin',
      cache: 'no-store',
    });
  } catch {
    throw new HealthApiError('Unable to connect to API');
  }
  if (!response.ok) {
    throw new HealthApiError(`Health endpoint returned HTTP ${response.status}`);
  }
  try {
    return parseApiHealth(await response.json());
  } catch (error) {
    if (error instanceof HealthApiError) throw error;
    throw new HealthApiError('Invalid JSON from API');
  }
}

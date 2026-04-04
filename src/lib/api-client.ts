type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

const buildHeaders = (headers?: HeadersInit) => ({
  'Content-Type': 'application/json',
  ...(headers || {}),
});

export const apiFetch = async <T>(
  url: string,
  method: Method = 'GET',
  body?: unknown,
  init?: RequestInit,
): Promise<T> => {
  const response = await fetch(url, {
    method,
    credentials: 'include',
    headers: buildHeaders(init?.headers),
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    ...init,
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const data = await response.json();
      if (data?.message) message = data.message;
    } catch (error) {
      // ignore JSON parse errors
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const json = await response.json().catch(() => null);

  if (json?.success === false) {
    throw new Error(json.message || 'Request failed');
  }

  if (
    json?.success === true &&
    Object.prototype.hasOwnProperty.call(json, 'data')
  ) {
    return json.data as T;
  }

  return (json ?? undefined) as T;
};

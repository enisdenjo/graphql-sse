import http from 'http';

export function request(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  url: string,
  headers: http.IncomingHttpHeaders = {},
  params: Record<string, unknown> = {},
): Promise<{
  statusCode: number;
  statusMessage: string;
  headers: http.IncomingHttpHeaders;
  data: string;
}> {
  const u = new URL(url);

  if (method !== 'POST')
    for (const [key, val] of Object.entries(params)) {
      u.searchParams.set(key, String(val ?? ''));
    }

  return new Promise((resolve, reject) => {
    const req = http
      .request(u, { method, headers }, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          if (!res.statusCode)
            return reject(new Error('No status code in response'));
          if (!res.statusMessage)
            return reject(new Error('No status message in response'));
          resolve({
            statusCode: res.statusCode,
            statusMessage: res.statusMessage,
            headers: res.headers,
            data,
          });
        });
      })
      .on('error', reject);
    if (method === 'POST') req.write(JSON.stringify(params));
    req.end();
  });
}

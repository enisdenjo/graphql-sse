import http from 'http';

export function request(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  url: string,
  params: Record<string, unknown> = {},
  headers: Record<string, string> = {},
): Promise<string> {
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
          resolve(data);
        });
      })
      .on('error', reject);
    if (method === 'POST') req.write(JSON.stringify(params));
    req.end();
  });
}

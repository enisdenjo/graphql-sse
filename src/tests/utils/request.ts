import http from 'http';

export function request(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  url: string | URL,
  headers: http.IncomingHttpHeaders = {},
  body?: Record<string, unknown>,
): Promise<{
  statusCode: number;
  statusMessage: string;
  headers: http.IncomingHttpHeaders;
  data: string;
}> {
  return new Promise((resolve, reject) => {
    const req = http
      .request(url, { method, headers }, (res) => {
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
    if (method === 'POST' && body) req.write(JSON.stringify(body));
    req.end();
  });
}

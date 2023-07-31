import net from 'net';
import http from 'http';

const leftovers: Dispose[] = [];
afterAll(async () => {
  while (leftovers.length > 0) {
    await leftovers.pop()?.();
  }
});

export type Dispose = () => Promise<void>;

export function startDisposableServer(
  server: http.Server,
): [url: string, port: number, dispose: Dispose] {
  const sockets = new Set<net.Socket>();
  server.on('connection', (socket) => {
    sockets.add(socket);
    socket.once('close', () => sockets.delete(socket));
  });

  const dispose = async () => {
    for (const socket of sockets) {
      socket.destroy();
    }
    await new Promise<void>((resolve) => server.close(() => resolve()));
  };
  leftovers.push(dispose);

  server.listen(0);

  const { port } = server.address() as net.AddressInfo;
  const url = `http://localhost:${port}`;

  return [url, port, dispose];
}

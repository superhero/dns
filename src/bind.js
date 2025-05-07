import tcp from './tcp.js';
import udp from './udp.js';

const
  HOST = process.env.DNS_HOST ?? '0.0.0.0',
  PORT = process.env.DNS_PORT ?? 53

tcp.listen (PORT, HOST, () => console.log(`DNS (TCP) listening on ${HOST}:${PORT}`))
udp.bind   (PORT, HOST, () => console.log(`DNS (UDP) listening on ${HOST}:${PORT}`))
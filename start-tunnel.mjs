import { startTunnel } from 'untun';

/**
 * Which local port to expose publicly.
 *
 *   5174 — Vite dev server. It proxies /api to Express, so the tunnel gets the
 *          whole app. The usual choice while developing.
 *   5175 — Express, after `npm run build`. Serves dist/ and /api from one process.
 *
 * Override with TUNNEL_PORT if you are running the app somewhere else.
 */
const PORT = Number(process.env.TUNNEL_PORT || 5174);

async function main() {
  console.log(`Starting Cloudflare tunnel for Battleship Lite on port ${PORT}...`);
  const tunnel = await startTunnel({ port: PORT, acceptCloudflareNotice: true });
  const url = await tunnel.getURL();
  console.log('\n==================================================');
  console.log('🚀 BATTLESHIP LITE LIVE TUNNEL URL:');
  console.log(url);
  console.log('==================================================');
  console.log(`\nExposing localhost:${PORT}.`);
  if (PORT === 5174) {
    console.log('Make sure BOTH are running:  npm run dev:server  and  npm run dev');
  } else if (PORT === 5175) {
    console.log('Make sure the app is built first:  npm run build  then  npm start');
  }
  console.log('\n⚠  A public tunnel means anyone with the URL can create bookings.\n');
}

main().catch((err) => {
  console.error('Tunnel failed to start:', err);
});

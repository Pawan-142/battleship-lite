import { startTunnel } from 'untun';

async function main() {
  console.log('Starting Cloudflare tunnel for Battleship Lite on port 5174...');
  const tunnel = await startTunnel({ port: 5174, acceptCloudflareNotice: true });
  const url = await tunnel.getURL();
  console.log('\n==================================================');
  console.log('🚀 BATTLESHIP LITE LIVE TUNNEL URL:');
  console.log(url);
  console.log('==================================================\n');
}

main().catch((err) => {
  console.error('Tunnel failed to start:', err);
});

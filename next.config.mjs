/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Allow Next.js dev server to accept HMR WebSocket handshakes from LAN IPs.
  // Comma-separated list read from NEXT_ALLOWED_DEV_ORIGINS (set in .env.local).
  // In production, HMR is not active and this key is a no-op.
  allowedDevOrigins: (process.env.NEXT_ALLOWED_DEV_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
};

export default nextConfig;

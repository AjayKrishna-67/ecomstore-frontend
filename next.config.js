/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    // `next/image` is not used anywhere in this app, so the built-in image
    // optimizer is pure attack surface. Disabling it neutralizes the
    // image-optimizer DoS / cache-exhaustion advisories and removes the
    // previously wide-open (`hostname: '**'`) remote-fetch proxy. If a
    // `next/image` component is ever introduced, drop `unoptimized` and add a
    // tightly-scoped `remotePatterns` for the specific asset host(s).
    unoptimized: true,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

module.exports = nextConfig;

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizePackageImports: ['@corsaro-creative/super-react']
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cloudflareinsights.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https: http:",
              "font-src 'self' data:",
              "connect-src 'self' https://connect.squareup.com https://connect.squareupsandbox.com https://api.clerk.com https://*.stackauth.com wss://*.stackauth.com https://cloudflareinsights.com",
              "frame-src 'self' https://connect.squareup.com https://connect.squareupsandbox.com",
              "form-action 'self' https://connect.squareup.com https://connect.squareupsandbox.com"
            ].join('; ')
          }
        ]
      }
    ]
  }
};
export default nextConfig;
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
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://web.squarecdn.com https://sandbox.web.squarecdn.com https://cloudflareinsights.com https://*.stackauth.com",
              "style-src 'self' 'unsafe-inline' https://web.squarecdn.com https://sandbox.web.squarecdn.com https://*.stackauth.com",
              "img-src 'self' data: https: http:",
              "font-src 'self' data: https://square-fonts-production-f.squarecdn.com https://d1g145x70srn7h.cloudfront.net https://*.stackauth.com",
              "connect-src 'self' https://connect.squareup.com https://connect.squareupsandbox.com https://pci-connect.squareup.com https://pci-connect.squareupsandbox.com https://o160250.ingest.sentry.io https://api.clerk.com https://*.stackauth.com https://api.stack-auth.com wss://*.stackauth.com https://cloudflareinsights.com",
              "frame-src 'self' https://connect.squareup.com https://connect.squareupsandbox.com https://web.squarecdn.com https://sandbox.web.squarecdn.com https://*.stackauth.com",
              "form-action 'self' https://connect.squareup.com https://connect.squareupsandbox.com"
            ].join('; ')
          }
        ]
      }
    ]
  }
};
export default nextConfig;
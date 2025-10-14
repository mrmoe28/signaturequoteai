'use client';

/**
 * Payment Error Page
 *
 * Displayed when payment link generation fails or Square is not configured
 * Provides helpful information to users and administrators
 */

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

function PaymentErrorContent() {
  const searchParams = useSearchParams();
  const quoteId = searchParams.get('quoteId');
  const error = searchParams.get('error');
  const isConfig = error === 'not_configured';

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-2xl w-full bg-card border border-border rounded-lg shadow-lg p-8">
        <div className="text-center">
          {/* Error Icon */}
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
            <svg
              className="w-10 h-10 text-red-600"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          {/* Error Title */}
          <h1 className="text-3xl font-bold text-foreground mb-4">
            {isConfig ? 'Payment System Not Configured' : 'Payment Link Error'}
          </h1>

          {/* Error Description */}
          <div className="text-muted-foreground mb-8 space-y-3">
            {isConfig ? (
              <>
                <p>
                  The payment processing system has not been set up yet. This is a
                  configuration issue that needs to be resolved by the system administrator.
                </p>
                <p className="text-sm">
                  <strong>For administrators:</strong> Square payment integration needs to be
                  configured with valid API credentials.
                </p>
              </>
            ) : (
              <>
                <p>
                  We encountered an error while generating your payment link. This may be
                  temporary.
                </p>
                <p className="text-sm">
                  Error details: {error || 'Unknown error'}
                </p>
              </>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {quoteId && (
              <Link
                href={`/quotes/${quoteId}`}
                className="inline-flex items-center justify-center px-6 py-3 border border-border rounded-md text-base font-medium text-foreground bg-background hover:bg-accent transition-colors"
              >
                View Quote
              </Link>
            )}
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent rounded-md text-base font-medium text-white bg-teal-700 hover:bg-teal-800 transition-colors"
            >
              Go to Dashboard
            </Link>
          </div>

          {/* Administrator Information */}
          {isConfig && (
            <div className="mt-12 p-6 bg-muted rounded-lg text-left">
              <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center">
                <svg
                  className="w-5 h-5 mr-2 text-teal-700"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Setup Instructions
              </h2>
              <div className="text-sm text-muted-foreground space-y-2">
                <p>To enable payment processing:</p>
                <ol className="list-decimal list-inside space-y-1 ml-4">
                  <li>Create a Square account at squareup.com</li>
                  <li>Get your API credentials from the Square Developer Dashboard</li>
                  <li>Add the credentials to your environment variables</li>
                  <li>Restart the application</li>
                </ol>
                <p className="mt-4">
                  <strong>Documentation:</strong>{' '}
                  <code className="bg-background px-2 py-1 rounded text-xs">
                    docs/SQUARE_PAYMENT_SETUP.md
                  </code>
                </p>
                <p>
                  <strong>Validation:</strong>{' '}
                  <code className="bg-background px-2 py-1 rounded text-xs">
                    npm run env:validate
                  </code>
                </p>
              </div>
            </div>
          )}

          {/* Support Contact */}
          <div className="mt-8 pt-6 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Need help? Contact our support team for assistance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-700 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <PaymentErrorContent />
    </Suspense>
  );
}

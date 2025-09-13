'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { AlertCircle, Home, RefreshCw } from 'lucide-react'
import { Suspense } from 'react'

function AuthErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  const errorMessages: Record<string, { title: string; description: string; action: string }> = {
    Configuration: {
      title: 'Configuration Error',
      description: 'There is a problem with the server configuration. Please check your OAuth settings and environment variables.',
      action: 'Check your .env.local file for GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET'
    },
    AccessDenied: {
      title: 'Access Denied',
      description: 'You do not have permission to sign in.',
      action: 'Please contact support if you believe this is an error'
    },
    Verification: {
      title: 'Unable to Sign In',
      description: 'The sign in link is no longer valid. It may have been used already or expired.',
      action: 'Please request a new sign in link'
    },
    OAuthSignin: {
      title: 'OAuth Sign In Error',
      description: 'Error occurred while trying to authenticate with the OAuth provider.',
      action: 'Try signing in again or use a different method'
    },
    OAuthCallback: {
      title: 'OAuth Callback Error',
      description: 'Error occurred during the OAuth callback process.',
      action: 'Make sure your redirect URIs are configured correctly'
    },
    OAuthCreateAccount: {
      title: 'Account Creation Failed',
      description: 'Could not create an account with the OAuth provider.',
      action: 'Try signing in with a different method'
    },
    EmailCreateAccount: {
      title: 'Account Creation Failed',
      description: 'Could not create an account with the provided email.',
      action: 'Try signing in with a different email'
    },
    Callback: {
      title: 'Callback Error',
      description: 'Error occurred during the authentication callback.',
      action: 'Please try signing in again'
    },
    Default: {
      title: 'Authentication Error',
      description: 'An unexpected error occurred during authentication.',
      action: 'Please try again or contact support'
    }
  }

  const errorInfo = errorMessages[error || 'Default'] || errorMessages.Default

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-md w-full p-8 bg-gray-800/50 backdrop-blur-lg rounded-2xl shadow-2xl border border-gray-700">
        <div className="flex justify-center mb-6">
          <div className="p-3 bg-red-500/10 rounded-full">
            <AlertCircle className="h-12 w-12 text-red-500" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-center text-white mb-2">
          {errorInfo.title}
        </h1>

        <p className="text-gray-300 text-center mb-6">
          {errorInfo.description}
        </p>

        <div className="bg-gray-900/50 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-400">
            <span className="font-semibold text-gray-300">What to do:</span><br />
            {errorInfo.action}
          </p>
          {error === 'Configuration' && (
            <div className="mt-3 text-xs text-gray-500">
              <p>Common causes:</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Missing OAuth credentials</li>
                <li>Invalid client ID or secret</li>
                <li>Incorrect redirect URIs</li>
                <li>Environment variables not loaded</li>
              </ul>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <Link
            href="/auth/login"
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Link>

          <Link
            href="/"
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            <Home className="h-4 w-4" />
            Go Home
          </Link>
        </div>

        {process.env.NODE_ENV === 'development' && error && (
          <div className="mt-6 p-3 bg-gray-900/50 rounded-lg">
            <p className="text-xs text-gray-500">
              Error Code: <span className="font-mono text-gray-400">{error}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function AuthError() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="max-w-md w-full p-8 bg-gray-800/50 backdrop-blur-lg rounded-2xl shadow-2xl border border-gray-700">
          <div className="flex justify-center mb-6">
            <div className="p-3 bg-blue-500/10 rounded-full">
              <RefreshCw className="h-12 w-12 text-blue-500 animate-spin" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-center text-white mb-2">
            Loading...
          </h1>
          <p className="text-gray-300 text-center">
            Please wait while we load the error details.
          </p>
        </div>
      </div>
    }>
      <AuthErrorContent />
    </Suspense>
  )
}
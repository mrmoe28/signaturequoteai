'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { CreditCard, CheckCircle, XCircle, ExternalLink, RefreshCw } from 'lucide-react';

interface StripeIntegrationProps {
  userId: string;
  stripeConnected: boolean;
  stripeAccountId?: string | null;
  stripeConnectedAt?: Date | null;
}

export function StripeIntegration({
  userId,
  stripeConnected,
  stripeAccountId,
  stripeConnectedAt
}: StripeIntegrationProps) {
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [stripeConfig, setStripeConfig] = useState<{
    configured: boolean;
    clientId: string | null;
  } | null>(null);

  // Fetch Stripe configuration on mount
  useEffect(() => {
    fetch('/api/integrations/stripe/config')
      .then(res => res.json())
      .then(data => setStripeConfig(data))
      .catch(err => console.error('Failed to fetch Stripe config:', err));
  }, []);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      // Check if Stripe is configured
      if (!stripeConfig?.configured || !stripeConfig?.clientId) {
        alert('Stripe integration is not configured yet. Please contact support or configure Stripe OAuth credentials in your environment variables.');
        setConnecting(false);
        return;
      }

      // Generate Stripe OAuth URL
      const params = new URLSearchParams({
        client_id: stripeConfig.clientId,
        state: userId, // Use userId to verify callback
        scope: 'read_write',
        response_type: 'code',
        redirect_uri: `${window.location.origin}/api/integrations/stripe/callback`,
      });

      const stripeOAuthUrl = `https://connect.stripe.com/oauth/authorize?${params.toString()}`;

      console.log('Redirecting to Stripe OAuth:', stripeOAuthUrl);

      // Redirect to Stripe OAuth
      window.location.href = stripeOAuthUrl;
    } catch (error) {
      console.error('Error connecting to Stripe:', error);
      alert('Failed to connect to Stripe. Please try again.');
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect your Stripe account? You will no longer be able to accept payments until you reconnect.')) {
      return;
    }

    setDisconnecting(true);
    try {
      const response = await fetch('/api/integrations/stripe/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Failed to disconnect Stripe account');
      }

      alert('Stripe account disconnected successfully');
      window.location.reload();
    } catch (error) {
      console.error('Error disconnecting Stripe:', error);
      alert('Failed to disconnect Stripe account. Please try again.');
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Stripe Payment Integration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Server Configuration Status */}
        {stripeConfig && !stripeConfig.configured && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-900 font-medium mb-1">
              ⚠️ Stripe OAuth Not Configured
            </p>
            <p className="text-xs text-red-800">
              The server administrator needs to configure Stripe OAuth credentials (Client ID and Client Secret) before you can connect your Stripe account.
            </p>
          </div>
        )}

        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <p className="font-medium">Connection Status</p>
              {stripeConnected ? (
                <Badge className="bg-green-100 text-green-800 border-green-300">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Connected
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-gray-100 text-gray-800">
                  <XCircle className="w-3 h-3 mr-1" />
                  Not Connected
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {stripeConnected
                ? 'Your Stripe account is connected and ready to accept payments.'
                : 'Connect your Stripe account to enable payment processing in quotes.'}
            </p>
          </div>
        </div>

        {stripeConnected && (
          <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              {stripeAccountId && (
                <div>
                  <p className="text-muted-foreground">Account ID</p>
                  <p className="font-mono text-xs">{stripeAccountId.substring(0, 20)}...</p>
                </div>
              )}
              {stripeConnectedAt && (
                <div>
                  <p className="text-muted-foreground">Connected Since</p>
                  <p className="font-medium">
                    {new Date(stripeConnectedAt).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2">
          {!stripeConnected ? (
            <Button
              onClick={handleConnect}
              disabled={connecting || !stripeConfig?.configured}
              className="flex items-center gap-2"
            >
              <CreditCard className="w-4 h-4" />
              {connecting ? 'Connecting...' : 'Connect Stripe Account'}
            </Button>
          ) : (
            <Button
              onClick={handleDisconnect}
              variant="destructive"
              disabled={disconnecting}
              className="flex items-center gap-2"
            >
              <XCircle className="w-4 h-4" />
              {disconnecting ? 'Disconnecting...' : 'Disconnect'}
            </Button>
          )}
        </div>

        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-900 font-medium mb-1">
            How Stripe Payments Work
          </p>
          <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
            <li>Connect your Stripe account to enable payment processing</li>
            <li>When you send a quote, customers can pay directly through Stripe</li>
            <li>Payments are processed securely through your Stripe account</li>
            <li>You manage refunds and transactions in your Stripe Dashboard</li>
          </ul>
          <a
            href="https://stripe.com/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 mt-2"
          >
            Learn more about Stripe integration
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {!stripeConnected && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-xs text-yellow-900">
              <strong>Note:</strong> You&apos;ll need a Stripe account to accept payments.
              {' '}
              <a
                href="https://dashboard.stripe.com/register"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-yellow-700"
              >
                Sign up for free
              </a>
              {' '}
              if you don&apos;t have one yet.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

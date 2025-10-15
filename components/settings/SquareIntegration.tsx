'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Badge } from '@/components/ui/Badge';
import { CreditCard, CheckCircle, XCircle, ExternalLink, Loader2, Shield } from 'lucide-react';

interface SquareIntegrationProps {
  userId: string;
  squareConnected: boolean;
  squareMerchantId?: string | null;
  squareLocationId?: string | null;
  squareEnvironment?: string | null;
  squareConnectedAt?: Date | null;
}

export function SquareIntegration({
  userId,
  squareConnected,
  squareMerchantId,
  squareLocationId,
  squareEnvironment,
  squareConnectedAt
}: SquareIntegrationProps) {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(!squareConnected);
  const [accessToken, setAccessToken] = useState('');
  const [locationId, setLocationId] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const handleConnect = async () => {
    if (!accessToken || !locationId) {
      alert('Please enter both Access Token and Location ID');
      return;
    }

    setIsConnecting(true);
    try {
      const response = await fetch('/api/integrations/square/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken, locationId }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('Square account connected successfully!');
        // Use router.refresh() and then reload to ensure fresh data
        router.refresh();
        setTimeout(() => {
          window.location.href = '/settings?success=square_manual_connected';
        }, 500);
      } else {
        alert(data.error || 'Failed to connect Square account');
        setIsConnecting(false);
      }
    } catch (error) {
      console.error('Error connecting Square:', error);
      alert('Network error occurred. Please try again.');
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect your Square account? You will no longer be able to accept payments until you reconnect.')) {
      return;
    }

    setIsDisconnecting(true);
    try {
      const response = await fetch('/api/integrations/square/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (!response.ok) {
        // Show the specific error message from the API
        const errorMessage = data.error || 'Failed to disconnect Square account';
        alert(errorMessage);
        console.error('Disconnect error:', data);
        setIsDisconnecting(false);
        return;
      }

      alert('Square account disconnected successfully');
      // Force a full page reload to refresh all data
      window.location.href = '/settings';
    } catch (error) {
      console.error('Error disconnecting Square:', error);
      alert('Network error occurred. Please check your connection and try again.');
      setIsDisconnecting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Square Payment Integration
              {squareConnected ? (
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
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {squareConnected
                ? 'Your Square account is connected and ready to accept payments.'
                : 'Connect your Square account to enable payment processing in quotes.'}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'Hide' : 'Setup'}
          </Button>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4">
          {squareConnected ? (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 text-green-800 mb-2">
                  <CheckCircle className="w-4 h-4" />
                  <span className="font-medium">Square Connected Successfully</span>
                </div>
                <div className="text-sm text-green-700 space-y-1">
                  <p>Your quotes will now include payment links powered by Square.</p>
                  {squareLocationId && (
                    <p className="text-xs">Location ID: {squareLocationId}</p>
                  )}
                  {squareEnvironment && (
                    <p className="text-xs">Environment: {squareEnvironment}</p>
                  )}
                  {squareConnectedAt && (
                    <p className="text-xs">Connected: {new Date(squareConnectedAt).toLocaleDateString()}</p>
                  )}
                </div>
              </div>

              <Button
                onClick={handleDisconnect}
                variant="destructive"
                disabled={isDisconnecting}
                className="w-full"
              >
                {isDisconnecting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Disconnecting...
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 mr-2" />
                    Disconnect Square Account
                  </>
                )}
              </Button>
            </div>
          ) : (
            <>
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="space-y-2">
                    <h4 className="font-medium text-blue-900">Don&apos;t have a Square account?</h4>
                    <p className="text-sm text-blue-700">
                      Sign up for Square to start accepting credit card payments with competitive rates and next-day deposits.
                    </p>
                    <a
                      href="https://squareup.com/signup?v=developers&country=US&language=en"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 underline"
                    >
                      Create Square Account
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="accessToken">Square Access Token</Label>
                  <Input
                    id="accessToken"
                    type="password"
                    placeholder="EAAAxxxxxxxxxxxxxx"
                    value={accessToken}
                    onChange={(e) => setAccessToken(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Get this from your Square Developer Dashboard → Applications → Your App → Credentials
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="locationId">Square Location ID</Label>
                  <Input
                    id="locationId"
                    placeholder="LXXXXXXXXXXXXXXX"
                    value={locationId}
                    onChange={(e) => setLocationId(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Find this in Square Dashboard → Account & Settings → Locations
                  </p>
                </div>

                <Button
                  onClick={handleConnect}
                  disabled={!accessToken || !locationId || isConnecting}
                  className="w-full"
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Shield className="w-4 h-4 mr-2" />
                      Connect Square Account
                    </>
                  )}
                </Button>
              </div>

              <div className="p-4 bg-gray-50 border rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Setup Instructions:</h4>
                <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside">
                  <li>Create a Square Developer account at <a href="https://developer.squareup.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">developer.squareup.com</a></li>
                  <li>Create a new application in your Square Developer Dashboard</li>
                  <li>Copy your Access Token from the Credentials tab</li>
                  <li>Get your Location ID from your Square main dashboard</li>
                  <li>Paste both values above and click Connect</li>
                </ol>
              </div>
            </>
          )}

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900 font-medium mb-1">
              How Square Payments Work
            </p>
            <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
              <li>Connect your Square account using your API credentials</li>
              <li>When you send a quote, customers can pay directly through Square</li>
              <li>Payments are processed securely through your Square account</li>
              <li>You manage refunds and transactions in your Square Dashboard</li>
            </ul>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

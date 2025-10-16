'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { Settings, Save, Bell, Shield, Palette, Globe } from 'lucide-react';
import { SquareIntegration } from '@/components/settings/SquareIntegration';
import { useAuth } from '@/hooks/useAuth';

interface UserSquareData {
  squareConnected: boolean;
  squareMerchantId?: string | null;
  squareLocationId?: string | null;
  squareEnvironment?: string | null;
  squareConnectedAt?: string | null;
}


export default function SettingsPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [squareData, setSquareData] = useState<UserSquareData | null>(null);
  const [loadingSquare, setLoadingSquare] = useState(true);
  const [showSquareSuccess, setShowSquareSuccess] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/sign-in');
    }
  }, [user, isLoading, router]);

  // Fetch user's Square connection status
  useEffect(() => {
    const fetchSquareData = async () => {
      try {
        const response = await fetch(`/api/users/${user?.id}/square-status`);
        if (response.ok) {
          const data = await response.json();
          setSquareData(data);
        }
      } catch (error) {
        console.error('Failed to fetch Square data:', error);
      } finally {
        setLoadingSquare(false);
      }
    };

    if (user?.id) {
      fetchSquareData();
    }
  }, [user?.id]);


  // Refresh Square data when returning from OAuth
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const success = params.get('success');

    if ((success === 'square_connected' || success === 'square_manual_connected') && user?.id) {
      // Show success message
      setShowSquareSuccess(true);
      setTimeout(() => setShowSquareSuccess(false), 5000);

      // Refetch Square data after successful connection
      setLoadingSquare(true);
      fetch(`/api/users/${user.id}/square-status`)
        .then(res => res.json())
        .then(data => setSquareData(data))
        .catch(err => console.error('Failed to refresh Square data:', err))
        .finally(() => setLoadingSquare(false));

      // Clean up URL without reloading page
      window.history.replaceState({}, '', '/settings');
    }

  }, [user?.id]);
  const [settings, setSettings] = useState({
    // Notification Settings
    emailNotifications: true,
    quoteNotifications: true,
    productUpdates: false,
    
    // Display Settings
    theme: 'light',
    language: 'en',
    timezone: 'America/New_York',
    
    // Security Settings
    twoFactorAuth: false,
    sessionTimeout: 30,
    
    // Quote Settings
    defaultQuoteValidity: 30,
    autoSaveQuotes: true,
    defaultCurrency: 'USD',
    
    // Email Settings
    emailSignature: 'Best regards,\n[Your Name]\n[Your Title]\n[Company Name]',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert('Settings saved successfully!');
    } catch (error) {
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  // Show loading state while checking authentication
  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4 md:space-y-6 p-4 md:p-6">
      <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
        <Settings className="w-6 h-6 md:w-8 md:h-8 text-primary" />
        <h1 className="text-2xl md:text-3xl font-bold">Settings</h1>
      </div>

      {/* Success Message for Square Connection */}
      {showSquareSuccess && (
        <div className="p-3 md:p-4 bg-green-50 border border-green-200 rounded-lg flex items-start md:items-center gap-3">
          <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 md:w-5 md:h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm md:text-base text-green-900">Square Account Connected!</p>
            <p className="text-xs md:text-sm text-green-700 mt-1">Your Square account has been successfully connected. You can now generate payment links in quotes.</p>
          </div>
          <button
            onClick={() => setShowSquareSuccess(false)}
            className="text-green-600 hover:text-green-800 flex-shrink-0"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}


      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start md:items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <Label htmlFor="emailNotifications" className="text-sm md:text-base">Email Notifications</Label>
              <p className="text-xs md:text-sm text-muted-foreground mt-0.5">Receive email notifications for important updates</p>
            </div>
            <input
              type="checkbox"
              id="emailNotifications"
              checked={settings.emailNotifications}
              onChange={(e) => updateSetting('emailNotifications', e.target.checked)}
              className="w-5 h-5 md:w-4 md:h-4 flex-shrink-0 mt-1"
            />
          </div>

          <div className="flex items-start md:items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <Label htmlFor="quoteNotifications" className="text-sm md:text-base">Quote Notifications</Label>
              <p className="text-xs md:text-sm text-muted-foreground mt-0.5">Get notified when quotes are created or updated</p>
            </div>
            <input
              type="checkbox"
              id="quoteNotifications"
              checked={settings.quoteNotifications}
              onChange={(e) => updateSetting('quoteNotifications', e.target.checked)}
              className="w-5 h-5 md:w-4 md:h-4 flex-shrink-0 mt-1"
            />
          </div>

          <div className="flex items-start md:items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <Label htmlFor="productUpdates" className="text-sm md:text-base">Product Updates</Label>
              <p className="text-xs md:text-sm text-muted-foreground mt-0.5">Receive notifications about product price changes</p>
            </div>
            <input
              type="checkbox"
              id="productUpdates"
              checked={settings.productUpdates}
              onChange={(e) => updateSetting('productUpdates', e.target.checked)}
              className="w-5 h-5 md:w-4 md:h-4 flex-shrink-0 mt-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Display Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Display & Language
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="theme">Theme</Label>
              <select
                id="theme"
                value={settings.theme}
                onChange={(e) => updateSetting('theme', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="auto">Auto</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <select
                id="language"
                value={settings.language}
                onChange={(e) => updateSetting('language', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <select
              id="timezone"
              value={settings.timezone}
              onChange={(e) => updateSetting('timezone', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="America/New_York">Eastern Time</option>
              <option value="America/Chicago">Central Time</option>
              <option value="America/Denver">Mountain Time</option>
              <option value="America/Los_Angeles">Pacific Time</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Security
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="twoFactorAuth">Two-Factor Authentication</Label>
              <p className="text-sm text-muted-foreground">Add an extra layer of security to your account</p>
            </div>
            <input
              type="checkbox"
              id="twoFactorAuth"
              checked={settings.twoFactorAuth}
              onChange={(e) => updateSetting('twoFactorAuth', e.target.checked)}
              className="w-4 h-4"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
            <Input
              id="sessionTimeout"
              type="number"
              value={settings.sessionTimeout}
              onChange={(e) => updateSetting('sessionTimeout', parseInt(e.target.value))}
              min="5"
              max="480"
            />
          </div>
        </CardContent>
      </Card>

      {/* Quote Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Quote Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="defaultQuoteValidity">Default Quote Validity (days)</Label>
              <Input
                id="defaultQuoteValidity"
                type="number"
                value={settings.defaultQuoteValidity}
                onChange={(e) => updateSetting('defaultQuoteValidity', parseInt(e.target.value))}
                min="1"
                max="365"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="defaultCurrency">Default Currency</Label>
              <select
                id="defaultCurrency"
                value={settings.defaultCurrency}
                onChange={(e) => updateSetting('defaultCurrency', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="CAD">CAD (C$)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="autoSaveQuotes">Auto-save Quotes</Label>
              <p className="text-sm text-muted-foreground">Automatically save quotes as you work</p>
            </div>
            <input
              type="checkbox"
              id="autoSaveQuotes"
              checked={settings.autoSaveQuotes}
              onChange={(e) => updateSetting('autoSaveQuotes', e.target.checked)}
              className="w-4 h-4"
            />
          </div>
        </CardContent>
      </Card>

      {/* Email Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Email Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="emailSignature">Email Signature</Label>
            <Textarea
              id="emailSignature"
              value={settings.emailSignature}
              onChange={(e) => updateSetting('emailSignature', e.target.value)}
              placeholder="Enter your email signature..."
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              This signature will be added to all outgoing quote emails
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Square Integration */}
      {!loadingSquare && (
        <SquareIntegration
          userId={user.id}
          squareConnected={squareData?.squareConnected || false}
          squareMerchantId={squareData?.squareMerchantId}
          squareLocationId={squareData?.squareLocationId}
          squareEnvironment={squareData?.squareEnvironment}
          squareConnectedAt={squareData?.squareConnectedAt ? new Date(squareData.squareConnectedAt) : null}
        />
      )}

      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
}

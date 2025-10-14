'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { CompanySettings } from '@/lib/types';
import { Save, Building2 } from 'lucide-react';
import ImageUpload from '@/components/ImageUpload';

export default function CompanySettingsPage() {
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCompanySettings();
  }, []);

  const fetchCompanySettings = async () => {
    try {
      const response = await fetch('/api/company');
      if (response.ok) {
        const result = await response.json();
        // API returns { success: true, data: settings }
        setSettings(result.data || result);
      }
    } catch (error) {
      console.error('Failed to fetch company settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;

    setSaving(true);
    try {
      const response = await fetch('/api/company', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      const result = await response.json();

      if (response.ok) {
        // Update settings with the returned data
        if (result.data) {
          setSettings(result.data);
        }
        alert('Company settings saved successfully!');
      } else {
        const errorMessage = result.message || result.error || 'Failed to save company settings';
        console.error('Save error:', result);
        alert(errorMessage);
      }
    } catch (error) {
      console.error('Failed to save company settings:', error);
      alert('Failed to save company settings. Please check your connection and try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoChange = (logoUrl: string | null) => {
    setSettings(prev => prev ? { ...prev, companyLogo: logoUrl || '' } : null);
  };

  const updateSetting = (key: keyof CompanySettings, value: string) => {
    setSettings(prev => prev ? { ...prev, [key]: value } : null);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-8">Loading company settings...</div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-8 text-red-500">Failed to load company settings</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Building2 className="w-8 h-8 text-primary" />
        <h1 className="text-3xl font-bold">Company Settings</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Company Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Company Logo */}
          <div className="space-y-2">
            <Label>Company Logo</Label>
            <ImageUpload
              currentImage={settings.companyLogo}
              onImageChange={handleLogoChange}
              placeholder="Upload company logo"
              maxSize={5}
            />
          </div>

          {/* Company Name */}
          <div className="space-y-2">
            <Label htmlFor="companyName">Company Name *</Label>
            <Input
              id="companyName"
              value={settings.companyName}
              onChange={(e) => updateSetting('companyName', e.target.value)}
              placeholder="Enter company name"
            />
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="companyEmail">Email</Label>
              <Input
                id="companyEmail"
                type="email"
                value={settings.companyEmail || ''}
                onChange={(e) => updateSetting('companyEmail', e.target.value)}
                placeholder="company@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyPhone">Phone</Label>
              <Input
                id="companyPhone"
                value={settings.companyPhone || ''}
                onChange={(e) => updateSetting('companyPhone', e.target.value)}
                placeholder="(555) 123-4567"
              />
            </div>
          </div>

          {/* Website */}
          <div className="space-y-2">
            <Label htmlFor="companyWebsite">Website</Label>
            <Input
              id="companyWebsite"
              value={settings.companyWebsite || ''}
              onChange={(e) => updateSetting('companyWebsite', e.target.value)}
              placeholder="https://www.example.com"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Address Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="companyAddress">Address</Label>
            <Input
              id="companyAddress"
              value={settings.companyAddress || ''}
              onChange={(e) => updateSetting('companyAddress', e.target.value)}
              placeholder="123 Main Street"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="companyCity">City</Label>
              <Input
                id="companyCity"
                value={settings.companyCity || ''}
                onChange={(e) => updateSetting('companyCity', e.target.value)}
                placeholder="City"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyState">State</Label>
              <Input
                id="companyState"
                value={settings.companyState || ''}
                onChange={(e) => updateSetting('companyState', e.target.value)}
                placeholder="State"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyZip">ZIP Code</Label>
              <Input
                id="companyZip"
                value={settings.companyZip || ''}
                onChange={(e) => updateSetting('companyZip', e.target.value)}
                placeholder="12345"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quote Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="quotePrefix">Quote Prefix</Label>
            <Input
              id="quotePrefix"
              value={settings.quotePrefix}
              onChange={(e) => updateSetting('quotePrefix', e.target.value)}
              placeholder="Q"
              className="w-32"
            />
            <p className="text-xs text-muted-foreground">
              Prefix for quote numbers (e.g., Q-123, INV-456)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="defaultTerms">Default Terms & Conditions</Label>
            <Textarea
              id="defaultTerms"
              value={settings.defaultTerms || ''}
              onChange={(e) => updateSetting('defaultTerms', e.target.value)}
              placeholder="Enter default terms and conditions for quotes..."
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="defaultLeadTime">Default Lead Time</Label>
            <Input
              id="defaultLeadTime"
              value={settings.defaultLeadTime || ''}
              onChange={(e) => updateSetting('defaultLeadTime', e.target.value)}
              placeholder="Typical lead time 1–2 weeks"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="taxId">Tax ID</Label>
            <Input
              id="taxId"
              value={settings.taxId || ''}
              onChange={(e) => updateSetting('taxId', e.target.value)}
              placeholder="XX-XXXXXXX"
            />
          </div>
        </CardContent>
      </Card>

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

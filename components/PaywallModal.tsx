'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Crown, X, Zap } from 'lucide-react'

interface PaywallModalProps {
  isOpen: boolean
  onClose: () => void
  quotesUsed: number
  quotesLimit: number
  message?: string
}

export default function PaywallModal({ 
  isOpen, 
  onClose, 
  quotesUsed, 
  quotesLimit, 
  message 
}: PaywallModalProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const handleUpgrade = () => {
    setLoading(true)
    router.push('/pricing')
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="relative">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-full">
              <Crown className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle className="text-xl">Upgrade to Pro</CardTitle>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900 mb-2">
              {quotesUsed}/{quotesLimit}
            </div>
            <p className="text-gray-600">
              {message || `You've reached your limit of ${quotesLimit} free quotes this month.`}
            </p>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Zap className="h-4 w-4 text-blue-600" />
              Unlock with Pro Plan
            </h4>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 bg-blue-600 rounded-full" />
                Unlimited quotes per month
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 bg-blue-600 rounded-full" />
                Professional PDF branding
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 bg-blue-600 rounded-full" />
                Priority customer support
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 bg-blue-600 rounded-full" />
                Advanced analytics
              </li>
            </ul>
          </div>

          <div className="text-center space-y-3">
            <div className="text-sm text-gray-500">
              Starting at <span className="font-semibold text-gray-900">$29.99/month</span>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Maybe Later
              </Button>
              <Button
                onClick={handleUpgrade}
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {loading ? 'Redirecting...' : 'Upgrade Now'}
              </Button>
            </div>
          </div>

          <div className="text-xs text-gray-500 text-center">
            30-day money-back guarantee • Cancel anytime
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
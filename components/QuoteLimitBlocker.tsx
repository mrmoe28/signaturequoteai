'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Crown, Lock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface QuoteLimitBlockerProps {
  onUpgrade: () => void;
}

export default function QuoteLimitBlocker({ onUpgrade }: QuoteLimitBlockerProps) {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 z-[9999] flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-8 text-white text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-full mb-4 backdrop-blur-sm">
            <Lock className="w-10 h-10" />
          </div>
          <h1 className="text-4xl font-bold mb-2">Account Limit Reached</h1>
          <p className="text-blue-100 text-lg">
            You&apos;ve used all 5 quotes on the Free plan
          </p>
        </div>

        {/* Content */}
        <div className="p-8">
          <div className="mb-8 text-center">
            <p className="text-xl text-gray-700 mb-4">
              Upgrade to <span className="font-bold text-blue-600">Pro</span> to continue sending quotes
            </p>
            <p className="text-gray-600">
              You&apos;ve reached the maximum number of quotes for the Free plan.
              Upgrade now to unlock unlimited quotes and premium features.
            </p>
          </div>

          {/* Pro Features */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-500 rounded-full flex items-center justify-center">
                <Crown className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Pro Plan Benefits</h3>
            </div>

            <div className="grid gap-3">
              <div className="flex items-center gap-3 bg-white rounded-lg p-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="font-semibold text-gray-900">Unlimited Quotes</span>
              </div>

              <div className="flex items-center gap-3 bg-white rounded-lg p-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="font-semibold text-gray-900">Square Payment Links</span>
              </div>

              <div className="flex items-center gap-3 bg-white rounded-lg p-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="font-semibold text-gray-900">Advanced Analytics</span>
              </div>

              <div className="flex items-center gap-3 bg-white rounded-lg p-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="font-semibold text-gray-900">Priority Support</span>
              </div>

              <div className="flex items-center gap-3 bg-white rounded-lg p-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="font-semibold text-gray-900">Custom Branding</span>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="text-center mb-8">
            <div className="inline-block bg-blue-50 rounded-2xl px-6 py-4 mb-4">
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold text-blue-600">$29</span>
                <span className="text-gray-600 text-lg">/month</span>
              </div>
            </div>
          </div>

          {/* CTA Button */}
          <Button
            onClick={onUpgrade}
            className="w-full py-6 text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 shadow-lg hover:shadow-xl transition-all"
          >
            <Crown className="w-6 h-6 mr-2" />
            Upgrade to Pro Now
            <ArrowRight className="w-6 h-6 ml-2" />
          </Button>

          <p className="text-center text-sm text-gray-500 mt-4">
            Questions? Contact support@signaturequotecrawler.com
          </p>
        </div>
      </div>
    </div>
  );
}

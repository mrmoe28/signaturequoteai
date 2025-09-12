'use client';
import { useState, useRef, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { User, Settings, Building2, LogOut, ChevronDown, CreditCard } from 'lucide-react';
import { Button } from './ui/Button';
import Link from 'next/link';
import Image from 'next/image';

export default function ProfileDropdown() {
  const { data: session, status } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (status === 'loading') {
    return <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />;
  }

  if (!session) {
    return (
      <div className="flex gap-2">
        <Link href="/auth/login">
          <Button variant="ghost" size="sm">Sign In</Button>
        </Link>
        <Link href="/auth/register">
          <Button size="sm">Sign Up</Button>
        </Link>
      </div>
    );
  }

  const handleLogout = () => {
    setIsOpen(false);
    signOut({ callbackUrl: '/' });
  };

  // Usage indicator
  const quotesUsed = session.user.quotesUsed || 0;
  const quotesLimit = session.user.quotesLimit || 3;
  const isSubscribed = session.user.subscriptionStatus === 'active';

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 h-auto"
      >
        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
          {session.user.image ? (
            <Image 
              src={session.user.image} 
              alt={session.user.name || 'Profile'} 
              width={32}
              height={32}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <User className="w-4 h-4 text-primary-foreground" />
          )}
        </div>
        <span className="hidden md:inline text-sm font-medium">
          {session.user.name?.split(' ')[0] || 'Profile'}
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
          <div className="px-4 py-2 border-b border-gray-100">
            <p className="text-sm font-medium text-gray-900">
              {session.user.name || session.user.email}
            </p>
            <p className="text-xs text-gray-500">{session.user.email}</p>
            
            {/* Usage indicator */}
            <div className="mt-2 text-xs">
              {isSubscribed ? (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Pro Plan - Unlimited
                </span>
              ) : (
                <div className="space-y-1">
                  <span className="text-gray-600">
                    Quotes used: {quotesUsed}/{quotesLimit}
                  </span>
                  <div className="w-full bg-gray-200 rounded-full h-1">
                    <div 
                      className="bg-blue-600 h-1 rounded-full" 
                      style={{ width: `${(quotesUsed / quotesLimit) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="py-1">
            <Link
              href="/profile"
              className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <User className="w-4 h-4" />
              Profile
            </Link>
            
            <Link
              href="/company"
              className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <Building2 className="w-4 h-4" />
              Company Settings
            </Link>
            
            {!isSubscribed && (
              <Link
                href="/pricing"
                className="flex items-center gap-3 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <CreditCard className="w-4 h-4" />
                Upgrade to Pro
              </Link>
            )}
            
            <Link
              href="/settings"
              className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <Settings className="w-4 h-4" />
              Settings
            </Link>
          </div>
          
          <div className="border-t border-gray-100 py-1">
            <button
              className="flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors w-full text-left"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';
import { useSession } from 'next-auth/react';

export default function NavLinks() {
  const { data: session, status } = useSession();

  if (status !== 'authenticated' || !session) {
    return null;
  }

  return (
    <nav className="flex items-center gap-3 md:gap-6 text-xs md:text-sm">
      <a href="/dashboard" className="text-muted-foreground hover:text-foreground">Dashboard</a>
      <a href="/products" className="text-muted-foreground hover:text-foreground">Products</a>
      <a href="/quotes/new" className="text-muted-foreground hover:text-foreground">New Quote</a>
      <a href="/cart" className="text-muted-foreground hover:text-foreground">Cart</a>
    </nav>
  );
}



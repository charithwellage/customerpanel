import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Account Sign In & Portal | CarChief',
  description: 'Sign in to access your CarChief order history, reservation updates, and secure account portal.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AccountLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

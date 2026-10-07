import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { LanguageProvider } from '@/components/language';
import { PumpSelectionProvider } from '@/components/pump-selection';
import './globals.css';

export const metadata: Metadata = {
  title: 'JESSBERGER | Eccentric Screw Pumps',
  description: 'JESSBERGER internal quotation workspace',
  robots: { index: false, follow: false },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const language = (await cookies()).get('language')?.value === 'en' ? 'en' : 'de';
  return <html lang={language}><body><LanguageProvider initial={language}><PumpSelectionProvider>{children}</PumpSelectionProvider></LanguageProvider></body></html>;
}

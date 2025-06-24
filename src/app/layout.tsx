import '~/styles/globals.css';
import { Inter } from 'next/font/google';
import { Toaster } from '~/components/ui/sonner';
import { SessionProvider } from 'next-auth/react';
import { auth } from '~/server/auth';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata = {
  title: 'ClipMatic',
  description: 'Create engaging podcast clips with AI',
  icons: [{ rel: 'icon', url: '/favicon.ico' }],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <html lang="en">
      <body className={`font-sans ${inter.variable}`}>
        <SessionProvider session={session}>
          {children}
          <Toaster />
        </SessionProvider>
      </body>
    </html>
  );
}

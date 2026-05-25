import './globals.css';
import {Providers} from './providers';

export const metadata = {
  title: 'NordicFleet',
  description: 'Track and manage your nordic skis.',
};

export const viewport = {
  themeColor: '#0a0a0a',
};

export default function RootLayout({children}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-bg text-text-primary">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

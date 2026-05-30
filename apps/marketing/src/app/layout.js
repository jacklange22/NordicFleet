import './globals.css';
import {Nav} from '@/components/Nav';
import {Footer} from '@/components/Footer';
import {MARKETING_URL} from '@/lib/urls';

const SITE_URL = MARKETING_URL;
const DESCRIPTION =
  'NordicFleet is the ski and wax logbook for nordic racers and coaches. Track your fleet, log conditions, and run head-to-head wax tests that settle the argument.';

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'NordicFleet: the wax logbook for nordic racers',
    template: '%s · NordicFleet',
  },
  description: DESCRIPTION,
  keywords: [
    'nordic skiing',
    'cross country skiing',
    'ski wax',
    'wax testing',
    'ski log',
    'wax log',
    'ski coach',
  ],
  openGraph: {
    title: 'NordicFleet: the wax logbook for nordic racers',
    description: DESCRIPTION,
    url: SITE_URL,
    siteName: 'NordicFleet',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NordicFleet: the wax logbook for nordic racers',
    description: DESCRIPTION,
  },
};

export default function RootLayout({children}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Nav />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}

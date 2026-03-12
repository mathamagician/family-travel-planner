import "./globals.css";
import { Providers } from "../components/Providers";
import GoogleAnalytics from "../components/GoogleAnalytics";

const SITE_URL = "https://www.toddlertrip.com";

export const metadata = {
  title: {
    default: "Toddler Trip — Family Travel Planner Built Around Nap Time",
    template: "%s | Toddler Trip",
  },
  description:
    "Plan family vacations around your kids' nap schedules, ages, and interests. AI-powered day-by-day itineraries with age-appropriate activities, packing lists, and booking links.",
  keywords: [
    "family travel planner",
    "toddler travel",
    "kid-friendly itinerary",
    "nap schedule travel",
    "family vacation planner",
    "travel with toddlers",
    "family trip planner",
  ],
  metadataBase: new URL(SITE_URL),
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: "Toddler Trip",
    title: "Toddler Trip — Family Travel Planner Built Around Nap Time",
    description:
      "AI-powered family itineraries built around your kids' nap schedules, ages, and energy levels. Day-by-day plans with activities, packing lists, and booking links.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Toddler Trip — Family Travel Planner" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Toddler Trip — Family Travel Planner",
    description: "Plan family vacations around nap time. AI-powered itineraries for families with young kids.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-video-preview": -1, "max-image-preview": "large", "max-snippet": -1 },
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <GoogleAnalytics />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

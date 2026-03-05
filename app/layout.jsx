import "./globals.css";
import { Providers } from "../components/Providers";

export const metadata = {
  title: "Family Travel Planner",
  description: "Customized travel itineraries built around your kids' nap schedules, ages, and interests.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

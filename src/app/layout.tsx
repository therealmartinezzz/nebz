import type { Metadata } from "next";
import Navigation from "@/components/Navigation";
import Notifications from "@/components/Notifications";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nəbz",
  description: "AI ilə xidmət keyfiyyəti məşqi və qiymətləndirməsi",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="az">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Notifications><Navigation />{children}</Notifications>
      </body>
    </html>
  );
}

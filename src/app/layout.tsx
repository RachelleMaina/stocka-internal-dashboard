import type { Metadata } from "next";
import localFont from "next/font/local";
// import "react-calendar/dist/Calendar.css";
// import "react-clock/dist/Clock.css";
// import "react-datetime-picker/dist/DateTimePicker.css";
import ClientLayout from "@/app/ClientLayout";
import { ReactQueryProvider } from "./QueryProvider";

const satoshi = localFont({
  src: "../fonts/Satoshi-Variable.woff2",
});

export const metadata: Metadata = {
  title: "Stocka",
  description: "Pos and Inventory Management Solution.",
  manifest: "/manifest.json",
  icons: [
    { rel: "apple-touch-icon", url: "/icons/icon-192x192.png" },
    { rel: "icon", url: "/icons/icon-192x192.png" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={satoshi.className}>
        <ReactQueryProvider>
          <ClientLayout>{children}</ClientLayout>
        </ReactQueryProvider>
      </body>
    </html>
  );
}

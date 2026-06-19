import type { Metadata } from "next";
import { Montserrat, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";

const montserrat = Montserrat({ variable: "--font-montserrat", subsets: ["latin"] });
const jetbrainsMono = JetBrains_Mono({ variable: "--font-jetbrains-mono", subsets: ["latin"] });

export const metadata: Metadata = { title: "Serve-It", description: "Secure, high-performance static file serving" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${montserrat.variable} ${jetbrainsMono.variable} antialiased bg-background text-foreground transition-colors duration-200`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

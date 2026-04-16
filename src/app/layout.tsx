import type { Metadata } from "next";
import { Cinzel, EB_Garamond } from "next/font/google";
import "./globals.css";

const cinzel = Cinzel({
  subsets: ["latin"],
  variable: "--font-cinzel",
  weight: ["400", "600", "700", "900"],
});

const ebGaramond = EB_Garamond({
  subsets: ["latin"],
  variable: "--font-garamond",
  weight: ["400", "500", "600", "700", "800"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Biblioteca de Alexandria — Gestão de Pergaminhos",
  description:
    "Sistema de gestão da Grande Biblioteca de Alexandria. Guarde, empreste e descubra os conhecimentos do mundo antigo.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${cinzel.variable} ${ebGaramond.variable}`}>
      <body className="font-garamond bg-papyrus-light text-ink-dark antialiased">
        {children}
      </body>
    </html>
  );
}

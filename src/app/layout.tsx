import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shopify Dispatcher Pro",
  description: "Gestion Shopify, dispatch automatique, livraisons, dépenses et appels clients."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}

import "@coinbase/onchainkit/styles.css";
import { Providers } from "@/src/providers";
import "../styles/globals.css";

export const metadata = {
  title: "ammo.wtf",
  description: "stack your bags with ammo",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

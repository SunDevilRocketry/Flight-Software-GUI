import "./globals.css";

export const metadata = {
  title: "SDR Broadcast Overlay"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

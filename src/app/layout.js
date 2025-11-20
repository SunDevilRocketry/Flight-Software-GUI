// /app/layout.js
import './styles/globals.css';

export const metadata = {
  title: 'Your App Title',
  description: 'App Description',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
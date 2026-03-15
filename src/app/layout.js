// /app/layout.js
import './styles/globals.css';

export const metadata = {
  title: 'Flight Dashboard',
  description: 'Sun Devil Rocketry\'s dashboard for flight avionics.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
import "./globals.css";
import { Toaster } from 'react-hot-toast';

export const metadata = {
  title: "KLiNO App",
  description: "E-Journal Dashboard for Literacy and Numeracy Monitoring",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Toaster position="top-right" />
        {children}
      </body>
    </html>
  );
}

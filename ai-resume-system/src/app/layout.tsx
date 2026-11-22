import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Prompteck AI Resume Analyzer",
  description: "AI-Powered Resume Feedback and Job Match Analyzer using a 6-stage Gemini prompt engineering pipeline",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}

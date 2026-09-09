import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import ChatBotWidget from "@/components/chat/ChatBotWidget";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata = {
  title: "AgriGuard — AMU/MRL Tracker | SIH25007",
  description:
    "Digital Farm Management System for tracking Antimicrobial Usage and Maximum Residue Limits in livestock. SIH25007 — FSSAI compliance dashboard.",
  keywords: "antimicrobial, AMU, MRL, livestock, farm management, FSSAI, SIH25007",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="theme-color" content="#0f172a" />
      </head>
      <body className={`${inter.className} antialiased bg-slate-950 text-slate-200 flex h-screen overflow-hidden`}>
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Header />
          <main className="flex-1 overflow-y-auto bg-slate-950 relative">
            {children}
            <ChatBotWidget />
          </main>
        </div>
      </body>
    </html>
  );
}

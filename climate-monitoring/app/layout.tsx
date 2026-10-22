import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Climate Monitoring",
  description: "BMKG Climate Monitoring Dashboard",
};

import Sidebar from "../components/Sidebar";
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-[var(--color-background)]`}>
        <div className="flex h-screen w-full overflow-hidden text-[var(--color-text-main)]">
          <div className="flex w-full h-full bg-white overflow-hidden">
            {/* Sidebar */}
            <Sidebar />            
            {/* Main Content */}
            <main className="flex-1 flex flex-col bg-[#F9FAFB] relative overflow-y-auto overflow-x-hidden">
              <div className="p-8 pb-20">
                {children}
              </div>
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}

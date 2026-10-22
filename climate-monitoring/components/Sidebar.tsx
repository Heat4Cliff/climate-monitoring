"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutDashboard, Users, MessageSquare, Settings, LogOut, User, Database, BarChart2 } from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { name: "Home", href: "/", icon: Home },
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Data Table", href: "/data", icon: Database },
    { name: "Monthly Stats", href: "/monthly-stats", icon: BarChart2 },
    { name: "Admin (Metabase)", href: "/dashboard/metabase", icon: Users },
  ];

  return (
    <aside className="w-64 bg-white flex-col hidden md:flex border-r border-[var(--color-border)] py-8 relative">
      {/* Profile Area */}
      <div className="flex flex-col items-center mb-10">
        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-[var(--color-primary)] relative mb-3">
          <User size={32} />
          <div className="absolute top-0 right-0 w-4 h-4 bg-[var(--color-primary)] border-2 border-white rounded-full"></div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-6 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link 
              key={item.name} 
              href={item.href} 
              className={`flex items-center px-4 py-3 transition-all rounded-xl font-medium ${
                isActive 
                  ? "bg-[var(--color-primary)] text-white shadow-md shadow-blue-200" 
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              <item.icon className="w-5 h-5 mr-4" /> {item.name}
            </Link>
          );
        })}
        
        <a href="#" className="flex items-center px-4 py-3 text-gray-500 hover:text-gray-900 transition-colors rounded-xl font-medium">
          <MessageSquare className="w-5 h-5 mr-4" /> Messages
        </a>
        <a href="#" className="flex items-center px-4 py-3 text-gray-500 hover:text-gray-900 transition-colors rounded-xl font-medium">
          <Settings className="w-5 h-5 mr-4" /> Settings
        </a>
      </nav>

      {/* Logout */}
      <div className="px-6 mt-auto">
        <a href="#" className="flex items-center px-4 py-3 text-gray-500 hover:text-gray-900 transition-colors rounded-xl font-medium">
          <LogOut className="w-5 h-5 mr-4" /> Logout
        </a>
      </div>
    </aside>
  );
}

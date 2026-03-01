import { useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useEffect, useState } from "react";
import { Droplets, LayoutDashboard, Settings, LogOut } from "lucide-react";
import { AnimatedLogo } from "@/components/ui/animated-logo";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { user, loading, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!loading && !user && location !== "/login") {
      setLocation("/login");
    }
  }, [loading, user, location, setLocation]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (loading || !user) return null;

  const handleLogout = async () => {
    await logout();
    setLocation("/login");
  };

  return (
    <div className="min-h-screen bg-teal-50/50 font-sans">
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-teal-100/50' : 'bg-transparent border-transparent'}`}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-2">
              <span className={`hidden sm:block mt-1 ${scrolled ? 'text-slate-900' : 'text-slate-800'}`}>
                <AnimatedLogo width="280" height="56" textColor={scrolled ? "#0f172a" : "#1e293b"} />
              </span>
            </div>
            
            <div className="flex items-center space-x-1 sm:space-x-4">
              <Link href="/dashboard" className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${location === '/dashboard' ? (scrolled ? 'bg-blue-50 text-blue-700' : 'bg-white/50 backdrop-blur text-blue-800') : (scrolled ? 'text-slate-600 hover:bg-slate-100 hover:text-slate-900' : 'text-slate-700 hover:bg-white/50')}`}>
                <LayoutDashboard size={18} />
                <span className="hidden sm:block">Dashboard</span>
              </Link>
              <Link href="/settings" className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${location === '/settings' ? (scrolled ? 'bg-blue-50 text-blue-700' : 'bg-white/50 backdrop-blur text-blue-800') : (scrolled ? 'text-slate-600 hover:bg-slate-100 hover:text-slate-900' : 'text-slate-700 hover:bg-white/50')}`}>
                <Settings size={18} />
                <span className="hidden sm:block">Settings</span>
              </Link>
              <button 
                onClick={handleLogout}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${scrolled ? 'text-slate-600 hover:bg-red-50 hover:text-red-700' : 'text-slate-700 hover:bg-white/50 hover:text-red-700'}`}
              >
                <LogOut size={18} />
                <span className="hidden sm:block">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>
      {/* Spacer to prevent content from going under the fixed header initially */}
      <div className="h-16"></div>
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
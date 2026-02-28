import { useLocation, Link } from "wouter";
import { getUser, clearUser } from "@/api/client";
import { useEffect } from "react";
import { Droplets, LayoutDashboard, Settings, LogOut } from "lucide-react";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const user = getUser();

  useEffect(() => {
    if (!user && location !== "/login") {
      setLocation("/login");
    }
  }, [user, location, setLocation]);

  if (!user) return null;

  const handleLogout = () => {
    clearUser();
    setLocation("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <Droplets size={24} />
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-900 hidden sm:block">WaterWise AI</span>
            </div>
            
            <div className="flex items-center space-x-1 sm:space-x-4">
              <Link href="/dashboard" className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${location === '/dashboard' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}>
                <LayoutDashboard size={18} />
                <span className="hidden sm:block">Dashboard</span>
              </Link>
              <Link href="/settings" className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${location === '/settings' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}>
                <Settings size={18} />
                <span className="hidden sm:block">Settings</span>
              </Link>
              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-700 transition-colors"
              >
                <LogOut size={18} />
                <span className="hidden sm:block">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
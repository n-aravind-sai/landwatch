import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Map, 
  AlertTriangle, 
  FileText, 
  Settings, 
  LogOut,
  Menu,
  X,
  Satellite
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'All Plots', href: '/plots/all', icon: Map },
    { name: 'Map View', href: '/plots/map', icon: Map },
    { name: 'Alerts', href: '/alerts', icon: AlertTriangle },
    { name: 'Documents', href: '/documents', icon: FileText },
    { name: 'Settings', href: '/profile', icon: Settings },
  ];

  const handleLogout = () => {
    localStorage.removeItem('landwatch_token');
    toast({
      title: "Logged out",
      description: "You have been successfully logged out."
    });
    navigate('/');
  };

  const isActive = (href: string) => location.pathname === href;

  return (
    <div className="h-screen flex overflow-hidden bg-satellite-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 flex z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" />
          
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                onClick={() => setSidebarOpen(false)}
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              >
                <X className="h-6 w-6 text-white" />
              </button>
            </div>
            <SidebarContent navigation={navigation} isActive={isActive} onLogout={handleLogout} />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <SidebarContent navigation={navigation} isActive={isActive} onLogout={handleLogout} />
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Mobile header */}
        <div className="md:hidden pl-1 pt-1 sm:pl-3 sm:pt-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-satellite-500 hover:text-satellite-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-satellite-500"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>

        {/* Page content */}
        <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none">
          <div className="p-4 md:p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

const SidebarContent = ({ navigation, isActive, onLogout }: any) => (
  <div className="flex flex-col h-full pt-5 pb-4 overflow-y-auto bg-white border-r border-satellite-200">
    {/* Logo */}
    <div className="flex items-center flex-shrink-0 px-4 mb-8">
      <Satellite className="h-8 w-8 text-satellite-600" />
      <span className="ml-2 text-xl font-bold text-satellite-900">LandWatch</span>
    </div>

    {/* Navigation */}
    <nav className="mt-5 flex-1 px-2 space-y-1">
      {navigation.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.name}
            to={item.href}
            className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
              isActive(item.href)
                ? 'bg-satellite-100 text-satellite-900'
                : 'text-satellite-600 hover:bg-satellite-50 hover:text-satellite-900'
            }`}
          >
            <Icon className="mr-3 h-5 w-5" />
            {item.name}
          </Link>
        );
      })}
    </nav>

    {/* Logout */}
    <div className="flex-shrink-0 px-2">
      <Button
        onClick={onLogout}
        variant="outline"
        className="w-full justify-start text-satellite-600 hover:text-red-600 hover:border-red-300"
      >
        <LogOut className="mr-3 h-5 w-5" />
        Logout
      </Button>
    </div>
  </div>
);

export default Layout;
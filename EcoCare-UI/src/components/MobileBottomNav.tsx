import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, MapPinned, Calendar, Car, User } from 'lucide-react';

interface NavItem {
  path: string;
  icon: React.ReactNode;
  label: string;
  badge?: number;
}

export const MobileBottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const navItems: NavItem[] = [
    {
      path: '/explore',
      icon: <Home size={24} />,
      label: 'Home',
    },
    {
      path: '/bookings',
      icon: <Calendar size={24} />,
      label: 'Bookings',
      badge: 2,
    },
    {
      path: '/vehicles',
      icon: <Car size={24} />,
      label: 'Vehicles',
    },
    {
      path: '/profile',
      icon: <User size={24} />,
      label: 'Profile',
    },
  ];
  
  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };
  
  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-outline-variant/20 safe-area-pb z-50">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`relative flex flex-col items-center justify-center w-16 h-16 rounded-xl transition-all ${
              isActive(item.path)
                ? 'text-primary'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <div className={`p-2 rounded-xl transition-all ${
              isActive(item.path) ? 'bg-primary/10' : ''
            }`}>
              {item.icon}
            </div>
            <span className="text-[10px] font-medium mt-1">
              {item.label}
            </span>
            
            {/* Badge Notification */}
            {item.badge && (
              <span className="absolute top-1 right-2 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

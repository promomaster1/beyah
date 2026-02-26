import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const Layout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  const navItems = [
    { path: '/dashboard', label: 'لوحة المعلومات', icon: '📊', roles: ['admin', 'data_entry', 'board_viewer'] },
    { path: '/data-entry', label: 'إدخال البيانات', icon: '✍️', roles: ['admin', 'data_entry'] },
    { path: '/targets', label: 'إدارة الأهداف', icon: '🎯', roles: ['admin'] },
    { path: '/indicators', label: 'إدارة المؤشرات', icon: '📈', roles: ['admin'] },
    { path: '/reports', label: 'التقارير', icon: '📄', roles: ['admin', 'board_viewer'] },
    { path: '/users', label: 'إدارة المستخدمين', icon: '👥', roles: ['admin'] },
  ];

  const visibleNavItems = navItems.filter(item => item.roles.includes(user?.role));

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50" dir="rtl">
      {/* Top Navigation Bar */}
      <nav className="bg-white/80 backdrop-blur-lg border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-reverse space-x-3 animate-slide-down">
              <img src="/logo.png" alt="جمعية البيئة بحائل" className="h-12 w-12" />
              <div>
                <h1 className="text-lg font-bold text-gray-800">جمعية البيئة بحائل</h1>
                <p className="text-xs text-gray-500">نظام تتبع مؤشرات الأداء</p>
              </div>
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-reverse space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-700">{user?.name}</p>
                <p className="text-xs text-gray-500">
                  {user?.role === 'admin' ? 'مدير النظام' : 
                   user?.role === 'data_entry' ? 'مدخل بيانات' : 'مشاهد'}
                </p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="rounded-full w-10 h-10 p-0" data-testid="user-menu-button">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-700 font-semibold">{user?.name?.charAt(0)}</span>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="text-right">حسابي</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-right cursor-pointer" data-testid="logout-button">
                    <span className="mr-2">🚪</span>
                    تسجيل الخروج
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </nav>

      {/* Side Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">
          {/* Sidebar */}
          <aside className="w-64 flex-shrink-0">
            <nav className="bg-white/80 backdrop-blur-lg rounded-lg shadow-sm p-4 space-y-1 sticky top-20">
              {visibleNavItems.map((item, index) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-reverse space-x-3 px-4 py-3 rounded-lg transition-all duration-200 card-hover ${
                    isActive(item.path)
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg scale-105'
                      : 'text-gray-700 hover:bg-green-50 hover:text-green-700'
                  }`}
                  style={{ animationDelay: `${index * 50}ms` }}
                  data-testid={`nav-${item.path.substring(1)}`}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </Link>
              ))}
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1 bg-white/60 backdrop-blur-sm rounded-lg shadow-sm p-6 animate-fade-in">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

export default Layout;
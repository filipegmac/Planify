import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, User as UserIcon, Calendar, Activity } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  title: string;
}

const Layout: React.FC<LayoutProps> = ({ children, title }) => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center text-primary font-bold text-2xl">
                <Activity className="w-8 h-8 mr-2" />
                Planify
              </div>
              <div className="ml-10 flex items-baseline space-x-4">
                <span className="text-gray-500 text-sm font-medium">{title}</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center text-sm text-gray-700">
                <div className="bg-gray-100 p-2 rounded-full mr-2">
                    <UserIcon size={16} className="text-gray-600" />
                </div>
                <div className="flex flex-col text-right">
                    <span className="font-medium">{user?.name}</span>
                    <span className="text-xs text-gray-500 uppercase">{user?.role}</span>
                </div>
              </div>
              <button
                onClick={logout}
                className="p-2 rounded-md text-gray-400 hover:text-red-500 hover:bg-gray-100 transition-colors"
                title="Sair"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-4">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} Planify. Sistema de Agendamento Médico.
        </div>
      </footer>
    </div>
  );
};

export default Layout;
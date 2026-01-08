import React from 'react';
import { UserSession, Role } from '../types';
import { 
  Users, 
  Phone, 
  LayoutDashboard, 
  LogOut, 
  Briefcase
} from 'lucide-react';

interface SidebarProps {
  user: UserSession;
  currentPage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ user, currentPage, onNavigate, onLogout }) => {
  const isSuperAdmin = user.role === Role.SUPER_ADMIN;
  const isAdminOrSuper = user.role === Role.ADMIN || isSuperAdmin;

  const getRoleName = (role: Role) => {
    switch (role) {
      case Role.SUPER_ADMIN: return '超级管理员';
      case Role.ADMIN: return '管理员';
      case Role.EMPLOYEE: return '销售员工';
      default: return role;
    }
  };

  const NavItem = ({ page, icon: Icon, label }: { page: string; icon: any; label: string }) => (
    <button
      onClick={() => onNavigate(page)}
      className={`flex items-center w-full px-4 py-3 text-sm font-medium transition-colors ${
        currentPage === page
          ? 'bg-blue-50 text-blue-700 border-r-4 border-blue-700'
          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
      }`}
    >
      <Icon className="w-5 h-5 mr-3" />
      {label}
    </button>
  );

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen fixed left-0 top-0">
      <div className="p-6 border-b border-gray-100">
        <h1 className="text-xl font-bold text-blue-600 flex items-center gap-2">
          <Phone className="fill-current" /> CRM Pro
        </h1>
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm font-semibold text-gray-900">{user.name}</p>
          <span className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block ${
            isSuperAdmin ? 'bg-purple-100 text-purple-700' :
            user.role === Role.ADMIN ? 'bg-indigo-100 text-indigo-700' :
            'bg-green-100 text-green-700'
          }`}>
            {getRoleName(user.role)}
          </span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-4">
        {/* Common Dashboard */}
        <NavItem page="dashboard" icon={LayoutDashboard} label="工作台" />

        {/* Admin / Super Admin Views */}
        {isAdminOrSuper && (
          <NavItem page="lead-pool" icon={Users} label="线索公海池" />
        )}

        {/* Super Admin Only */}
        {isSuperAdmin && (
          <NavItem page="employees" icon={Briefcase} label="员工管理" />
        )}

        {/* Employee View (Also visible to admins for testing context, but typically mainly for sales) */}
        <NavItem page="my-leads" icon={Phone} label="我的线索" />
      </nav>

      <div className="p-4 border-t border-gray-200">
        <button
          onClick={onLogout}
          className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
        >
          <LogOut className="w-4 h-4 mr-2" />
          退出登录
        </button>
      </div>
    </div>
  );
};
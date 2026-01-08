import React, { useState } from 'react';
import { Role, UserSession, EmployeeStatus } from '../types';
import { Lock, User, LogIn } from 'lucide-react';
import { mockListEmployees } from '../mock/api';

interface LoginProps {
  onLogin: (user: UserSession) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 1. Fetch latest employees data (including newly created ones)
      const employees = await mockListEmployees();
      
      setLoading(false);

      // 2. Check Password (Unified)
      if (password !== '123456') {
        setError('账号或密码错误 (提示: 默认密码 123456)');
        return;
      }

      let targetUser = null;

      // 3. Find User
      // Priority A: Hardcoded aliases for testing convenience
      if (username === 'admin') {
        targetUser = employees.find(e => e.role === Role.SUPER_ADMIN); // Usually emp_001
      } else if (username === 'manager') {
        targetUser = employees.find(e => e.role === Role.ADMIN); // Usually emp_002
      } else if (username === 'user') {
        targetUser = employees.find(e => e.role === Role.EMPLOYEE && e.status === EmployeeStatus.ACTIVE); // First active employee
      } else {
        // Priority B: Match by Email (For newly created employees)
        targetUser = employees.find(e => e.email === username);
      }

      // 4. Validate User
      if (targetUser) {
        if (targetUser.status === EmployeeStatus.INACTIVE) {
          setError('该账号已离职或停用，无法登录系统');
          return;
        }

        // Success
        onLogin({ 
          id: targetUser.id, 
          name: targetUser.name, 
          role: targetUser.role 
        });
      } else {
        setError('账号不存在');
      }

    } catch (e) {
      setLoading(false);
      setError('系统繁忙，请稍后重试');
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-xl shadow-xl w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">CRM Pro</h1>
          <p className="text-gray-500 mt-2">客户关系管理系统</p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm text-center border border-red-100">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">账号 / 邮箱</label>
            <div className="relative">
              <User className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="请输入邮箱或测试账号(admin)"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">密码</label>
            <div className="relative">
              <Lock className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码 (默认: 123456)"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-200 transition-all font-medium disabled:opacity-70"
          >
            {loading ? '登录中...' : (
              <>
                <LogIn className="w-4 h-4 mr-2" /> 登录系统
              </>
            )}
          </button>
        </form>
        
        <div className="mt-8 text-xs text-center text-gray-400 border-t border-gray-100 pt-4">
          <p>测试账号说明（密码统一 123456）：</p>
          <div className="flex justify-center gap-4 mt-2">
            <span>超管: admin</span>
            <span>管理: manager</span>
            <span>员工: user</span>
          </div>
          <p className="mt-1 text-gray-500">也可使用新建员工的 <strong>邮箱</strong> 登录</p>
        </div>
      </div>
    </div>
  );
};
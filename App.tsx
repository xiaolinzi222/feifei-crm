import React, { useState, useEffect } from 'react';
import { UserSession, Role } from './types';
import { Sidebar } from './components/Sidebar';
import { Login } from './pages/Login';
import { LeadPool } from './pages/LeadPool';
import { EmployeeManager } from './pages/EmployeeManager';
import { MyLeads } from './pages/MyLeads';

const App: React.FC = () => {
  const [user, setUser] = useState<UserSession | null>(null);
  const [currentPage, setCurrentPage] = useState('dashboard');

  // Load session from local storage to survive refreshes (optional for prototype, but nice)
  useEffect(() => {
    const saved = localStorage.getItem('crm_user');
    if (saved) {
      setUser(JSON.parse(saved));
    }
  }, []);

  const handleLogin = (session: UserSession) => {
    setUser(session);
    localStorage.setItem('crm_user', JSON.stringify(session));
    // Default redirects
    if (session.role === Role.EMPLOYEE) setCurrentPage('my-leads');
    else setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('crm_user');
    setCurrentPage('dashboard');
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  // Simple Router Switch
  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return (
          <div className="p-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-4">欢迎回来, {user.name}</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                <h3 className="text-gray-500 text-sm font-medium">系统状态</h3>
                <p className="text-2xl font-bold mt-2 text-gray-800">运行正常</p>
                <p className="text-sm text-gray-400 mt-1">Mock 接口响应中</p>
              </div>
            </div>
            {/* Helpful navigation hints for the prototype user */}
            <div className="mt-8 bg-blue-50 p-6 rounded-lg border border-blue-100">
              <h3 className="font-bold text-blue-800 mb-2">原型操作指引:</h3>
              <ul className="list-disc list-inside text-blue-700 space-y-1">
                {user.role === Role.SUPER_ADMIN && (
                  <li>前往 <strong>员工管理</strong>：操作员工离职，系统将自动回收其名下线索。</li>
                )}
                {(user.role === Role.ADMIN || user.role === Role.SUPER_ADMIN) && (
                  <li>前往 <strong>线索公海池</strong>：模拟导入数据，或进行手动/自动线索分配。</li>
                )}
                <li>前往 <strong>我的线索</strong>：以销售视角进行线索跟进、记录、或转成交。</li>
              </ul>
            </div>
          </div>
        );
      case 'lead-pool':
        return <LeadPool currentUserRole={user.role} />;
      case 'employees':
        if (user.role !== Role.SUPER_ADMIN) return <div className="p-8 text-red-500">无权访问</div>;
        return <EmployeeManager />;
      case 'my-leads':
        return <MyLeads currentUserId={user.id} />;
      default:
        return <div>页面不存在</div>;
    }
  };

  return (
    <div className="flex bg-gray-50 min-h-screen font-sans">
      <Sidebar 
        user={user} 
        currentPage={currentPage} 
        onNavigate={setCurrentPage} 
        onLogout={handleLogout} 
      />
      <main className="ml-64 flex-1">
        {renderPage()}
      </main>
    </div>
  );
};

export default App;
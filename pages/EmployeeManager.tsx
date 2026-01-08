import React, { useEffect, useState } from 'react';
import { Employee, EmployeeStatus, Role } from '../types';
import { 
  mockListEmployees, 
  mockDeactivateEmployee, 
  mockActivateEmployee,
  mockCreateEmployee,
  mockUpdateEmployee,
  mockDeleteEmployee
} from '../mock/api';
import { UserX, UserCheck, AlertTriangle, Plus, Edit, Trash2, X } from 'lucide-react';

export const EmployeeManager: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Modal States
  const [deactivateModal, setDeactivateModal] = useState<{ show: boolean, empId: string | null, empName: string }>({ show: false, empId: null, empName: '' });
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false); // NEW: Delete Modal
  const [editingEmployee, setEditingEmployee] = useState<Partial<Employee>>({});
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null); // NEW: Delete Target

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const data = await mockListEmployees();
      setEmployees(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  // --- CRUD Handlers ---

  const handleCreate = () => {
    setEditingEmployee({ 
      status: EmployeeStatus.ACTIVE, 
      role: Role.EMPLOYEE 
    });
    setShowEditModal(true);
  };

  const handleEdit = (emp: Employee) => {
    setEditingEmployee({ ...emp });
    setShowEditModal(true);
  };

  const handleDeleteClick = (emp: Employee) => {
    setDeleteTarget(emp);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setLoading(true);
    try {
      await mockDeleteEmployee(deleteTarget.id);
      await fetchEmployees();
      setShowDeleteModal(false);
      setDeleteTarget(null);
      // alert('员工已删除'); // Optional toast, usually modal closing is enough feedback if list updates
    } catch(e) {
      alert('删除失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingEmployee.id) {
        // Update
        await mockUpdateEmployee(editingEmployee.id, editingEmployee);
        alert('员工信息已更新');
      } else {
        // Create
        await mockCreateEmployee(editingEmployee);
        alert('新员工已创建');
      }
      setShowEditModal(false);
      await fetchEmployees();
    } catch(e) {
      alert('保存失败');
    } finally {
      setLoading(false);
    }
  };

  // --- Deactivation Handlers ---

  const handleDeactivateClick = (emp: Employee) => {
    setDeactivateModal({ show: true, empId: emp.id, empName: emp.name });
  };

  const confirmDeactivate = async () => {
    if (!deactivateModal.empId) return;
    setLoading(true);
    try {
      const res = await mockDeactivateEmployee(deactivateModal.empId);
      setDeactivateModal({ show: false, empId: null, empName: '' });
      await fetchEmployees();
      alert(`员工已停用。该员工名下的 ${res.recycledLeadCount} 条线索已自动回收至公海池。`);
    } catch (e) {
      alert("操作失败");
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async (id: string) => {
    if (!confirm("确定要重新启用该员工吗？\n注意：之前回收的线索不会自动恢复，需重新分配。")) return;
    setLoading(true);
    await mockActivateEmployee(id);
    await fetchEmployees();
    setLoading(false);
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">员工管理</h2>
          <p className="text-gray-500 text-sm">管理员工账号状态、角色及离职资源回收。</p>
        </div>
        <button 
          onClick={handleCreate}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"
        >
          <Plus className="w-4 h-4 mr-2" />
          新增员工
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">员工信息</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">角色</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">名下线索</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">成交客户</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">状态操作</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">编辑/删除</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {employees.map((emp) => (
              <tr key={emp.id} className={emp.status === EmployeeStatus.INACTIVE ? 'bg-gray-50' : ''}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                      {emp.name.charAt(0)}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{emp.name}</div>
                      <div className="text-sm text-gray-500">{emp.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`text-xs px-2 py-1 rounded border ${
                    emp.role === Role.SUPER_ADMIN ? 'bg-purple-50 text-purple-700 border-purple-200' :
                    emp.role === Role.ADMIN ? 'bg-blue-50 text-blue-700 border-blue-200' :
                    'bg-gray-50 text-gray-700 border-gray-200'
                  }`}>
                    {emp.role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {emp.status === EmployeeStatus.ACTIVE ? (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      在职
                    </span>
                  ) : (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                      已离职
                    </span>
                  )}
                  {emp.leftAt && <div className="text-xs text-red-500 mt-1">离职于: {new Date(emp.leftAt).toLocaleDateString()}</div>}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {emp.assignedLeadsCount}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {emp.customerCount}
                </td>
                
                {/* Status Actions */}
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {emp.status === EmployeeStatus.ACTIVE && emp.role !== Role.SUPER_ADMIN && (
                    <button 
                      onClick={() => handleDeactivateClick(emp)}
                      className="text-orange-600 hover:text-orange-900 flex items-center justify-end gap-1 ml-auto"
                      title="办理离职/停用"
                    >
                      <UserX className="w-4 h-4" /> 离职
                    </button>
                  )}
                  {emp.status === EmployeeStatus.INACTIVE && (
                    <button 
                      onClick={() => handleActivate(emp.id)}
                      className="text-green-600 hover:text-green-900 flex items-center justify-end gap-1 ml-auto"
                      title="重新启用"
                    >
                      <UserCheck className="w-4 h-4" /> 启用
                    </button>
                  )}
                </td>

                {/* Edit/Delete Actions */}
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end gap-3">
                    <button 
                      onClick={() => handleEdit(emp)}
                      className="text-blue-600 hover:text-blue-900"
                      title="编辑信息"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    {emp.role !== Role.SUPER_ADMIN && (
                      <button 
                        onClick={() => handleDeleteClick(emp)}
                        className="text-red-600 hover:text-red-900"
                        title="彻底删除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* --- MODALS --- */}

      {/* 1. Create/Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[500px] shadow-2xl relative">
            <button 
              onClick={() => setShowEditModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold mb-4">
              {editingEmployee.id ? '编辑员工' : '新增员工'}
            </h3>
            <form onSubmit={handleSaveEmployee} className="space-y-4">
               <div>
                 <label className="block text-sm font-medium text-gray-700">姓名</label>
                 <input 
                   required 
                   type="text" 
                   value={editingEmployee.name || ''} 
                   onChange={e => setEditingEmployee({...editingEmployee, name: e.target.value})} 
                   className="mt-1 w-full border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500" 
                 />
               </div>
               <div>
                 <label className="block text-sm font-medium text-gray-700">邮箱</label>
                 <input 
                   required 
                   type="email" 
                   value={editingEmployee.email || ''} 
                   onChange={e => setEditingEmployee({...editingEmployee, email: e.target.value})} 
                   className="mt-1 w-full border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500" 
                 />
               </div>
               <div>
                 <label className="block text-sm font-medium text-gray-700">角色</label>
                 <select 
                   value={editingEmployee.role} 
                   onChange={e => setEditingEmployee({...editingEmployee, role: e.target.value as Role})}
                   className="mt-1 w-full border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500"
                 >
                   <option value={Role.EMPLOYEE}>销售员工 (EMPLOYEE)</option>
                   <option value={Role.ADMIN}>管理员 (ADMIN)</option>
                   <option value={Role.SUPER_ADMIN}>超级管理员 (SUPER_ADMIN)</option>
                 </select>
               </div>
               <div>
                 <label className="block text-sm font-medium text-gray-700">状态</label>
                 <select 
                   value={editingEmployee.status} 
                   onChange={e => setEditingEmployee({...editingEmployee, status: e.target.value as EmployeeStatus})}
                   className="mt-1 w-full border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500"
                 >
                   <option value={EmployeeStatus.ACTIVE}>在职 (ACTIVE)</option>
                   <option value={EmployeeStatus.INACTIVE}>离职 (INACTIVE)</option>
                 </select>
               </div>
               
               <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-6">
                 <button 
                   type="button" 
                   onClick={() => setShowEditModal(false)}
                   className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md border border-gray-300"
                 >
                   取消
                 </button>
                 <button 
                   type="submit" 
                   disabled={loading} 
                   className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                 >
                   {loading ? '保存中...' : '保存'}
                 </button>
               </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Deactivate Confirmation Modal */}
      {deactivateModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <AlertTriangle className="w-8 h-8" />
              <h3 className="text-lg font-bold">确认员工离职？</h3>
            </div>
            <p className="text-gray-600 mb-4">
              您正在操作员工：<strong>{deactivateModal.empName}</strong>。
            </p>
            <div className="bg-red-50 p-4 rounded-md mb-6 border border-red-100">
              <h4 className="font-semibold text-red-800 text-sm mb-2">系统将执行以下操作：</h4>
              <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                <li>员工账号状态变为【离职/停用】。</li>
                <li>该员工名下所有【跟进中/已分配】的线索将<strong>自动回收</strong>。</li>
                <li>回收后的线索将回到公海池，状态重置为【待分配】。</li>
              </ul>
            </div>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setDeactivateModal({ show: false, empId: null, empName: '' })}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
              >
                取消
              </button>
              <button 
                onClick={confirmDeactivate}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 shadow-sm"
              >
                确认离职并回收
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Delete Confirmation Modal (NEW) */}
      {showDeleteModal && deleteTarget && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70]">
          <div className="bg-white rounded-lg p-6 w-96 shadow-xl border-t-4 border-red-500">
            <div className="flex items-center gap-3 text-gray-800 mb-4">
              <Trash2 className="w-6 h-6 text-red-500" />
              <h3 className="text-lg font-bold">确认彻底删除？</h3>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              您正在删除员工 <strong>{deleteTarget.name}</strong>。此操作为物理删除，无法恢复数据。建议优先使用“离职”功能。
            </p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => { setShowDeleteModal(false); setDeleteTarget(null); }} 
                className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                取消
              </button>
              <button 
                onClick={handleConfirmDelete}
                disabled={loading}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 shadow-sm disabled:opacity-50"
              >
                {loading ? '删除中...' : '确认删除'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
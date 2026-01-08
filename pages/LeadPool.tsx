import React, { useEffect, useState, useRef } from 'react';
import { Lead, Employee, LeadStatus, EmployeeStatus, Role, RecycleReason, FollowUp } from '../types';
import { 
  mockListLeads, 
  mockListEmployees, 
  mockAssignLeadsToEmployee, 
  mockAutoAssignLeads, 
  mockImportLeads,
  mockCreateLead,
  mockUpdateLeadInfo,
  mockDeleteLead,
  mockGetFollowUps
} from '../mock/api';
import { 
  UploadCloud, 
  Filter, 
  RefreshCw, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle, 
  AlertTriangle,
  Search,
  Plus,
  Trash2,
  Edit,
  Eye,
  Clock,
  Phone
} from 'lucide-react';

interface LeadPoolProps {
  currentUserRole: Role;
}

// User provided mock data for import simulation
const STATIC_IMPORT_DATA = [
  { "id": 1, "name": "张伟", "phone": "13800138001", "region": "北京" },
  { "id": 2, "name": "王芳", "phone": "13800138002", "region": "上海" },
  { "id": 3, "name": "李娜", "phone": "13800138003", "region": "广东-深圳" },
  { "id": 4, "name": "刘强", "phone": "13800138004", "region": "浙江-杭州" },
  { "id": 5, "name": "陈杰", "phone": "13800138005", "region": "江苏-南京" },
  { "id": 6, "name": "杨敏", "phone": "13800138006", "region": "四川-成都" },
  { "id": 7, "name": "赵磊", "phone": "13800138007", "region": "湖北-武汉" },
  { "id": 8, "name": "黄婷", "phone": "13800138008", "region": "湖南-长沙" },
  { "id": 9, "name": "周洋", "phone": "13800138009", "region": "重庆" },
  { "id": 10, "name": "徐静", "phone": "13800138010", "region": "福建-厦门" }
];

export const LeadPool: React.FC<LeadPoolProps> = ({ currentUserRole }) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]); 
  const [assignableEmployees, setAssignableEmployees] = useState<Employee[]>([]); 
  
  const [loading, setLoading] = useState(false);
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set());
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRecycled, setFilterRecycled] = useState(false);
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'ALL'>(LeadStatus.UNASSIGNED);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Notification
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  // Modals
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false); 
  const [showCreateModal, setShowCreateModal] = useState(false); 
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false); // NEW: Delete Modal

  // Operation State
  const [assignTargetId, setAssignTargetId] = useState('');
  const [editingLead, setEditingLead] = useState<Partial<Lead> | null>(null); 
  const [viewingLead, setViewingLead] = useState<Lead | null>(null);
  const [viewingFollowUps, setViewingFollowUps] = useState<FollowUp[]>([]);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null); // NEW: Delete Target
  
  // File Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isSuperAdmin = currentUserRole === Role.SUPER_ADMIN;

  const fetchData = async () => {
    setLoading(true);
    try {
      const allLeads = await mockListLeads();
      setLeads(allLeads);
      
      const allEmps = await mockListEmployees();
      setAllEmployees(allEmps);
      
      setAssignableEmployees(allEmps.filter(e => e.status === EmployeeStatus.ACTIVE && e.role !== Role.SUPER_ADMIN));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Reset pagination and selection when filters change
  useEffect(() => {
    setCurrentPage(1);
    setSelectedLeadIds(new Set()); 
  }, [filterRecycled, statusFilter, leads.length, searchQuery]);

  const showSuccess = (msg: string) => {
    setNotification({ message: msg, type: 'success' });
    setTimeout(() => setNotification(null), 3000);
  };

  // --- CRUD Handlers ---

  const handleCreate = () => {
    setEditingLead({}); 
    setShowCreateModal(true);
  };

  const handleEdit = (lead: Lead) => {
    setEditingLead({ ...lead });
    setShowCreateModal(true);
  };

  const handleViewDetails = async (lead: Lead) => {
    setViewingLead(lead);
    setShowDetailModal(true);
    try {
      const records = await mockGetFollowUps(lead.id);
      setViewingFollowUps(records);
    } catch (e) {
      setViewingFollowUps([]);
    }
  };

  // Updated: Open Modal instead of confirm()
  const handleDeleteClick = (id: string) => {
    setDeleteTargetId(id);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return;
    setLoading(true);
    try {
      await mockDeleteLead(deleteTargetId);
      await fetchData();
      showSuccess('线索已成功删除');
      setShowDeleteModal(false);
      setDeleteTargetId(null);
    } catch(e) {
      alert('删除失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLead) return;
    setLoading(true);
    try {
      if (editingLead.id) {
        await mockUpdateLeadInfo(editingLead.id, editingLead);
        showSuccess('线索更新成功');
      } else {
        await mockCreateLead(editingLead);
        showSuccess('新线索已创建');
      }
      setShowCreateModal(false);
      await fetchData();
    } catch (e) {
      alert('保存失败');
    } finally {
      setLoading(false);
    }
  };

  // --- Import Logic ---
  const handleOpenImport = () => {
    setSelectedFile(null);
    setShowImportModal(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleExecuteImport = async () => {
    if (!selectedFile) {
      alert("请先选择一个文件！");
      return;
    }

    setLoading(true);
    try {
      const batchId = `导入批次_${new Date().toISOString().slice(0, 10)}`;
      const newLeads = STATIC_IMPORT_DATA.map(item => ({
        name: item.name,
        phone: item.phone,
        region: item.region,
        source: 'Excel导入',
        batchId: batchId
      }));

      await mockImportLeads(newLeads);
      await fetchData();
      
      setShowImportModal(false);
      setSelectedFile(null);
      showSuccess(`成功导入 ${newLeads.length} 条线索！`);
    } catch (error) {
      console.error(error);
      alert("导入失败");
    } finally {
      setLoading(false);
    }
  };

  // --- Assignment Logic ---
  const handleAutoAssign = async () => {
    if(!window.confirm("确定要将所有【待分配】状态的线索，自动轮询分配给【在职】员工吗？")) return;
    setLoading(true);
    const res = await mockAutoAssignLeads();
    await fetchData();
    setLoading(false);
    showSuccess(`分配完成，共分配了 ${res.assignedCount} 条线索。`);
  };

  const handlePreAssign = () => {
    if (!assignTargetId) {
      alert("请先从下拉列表中选择一名接收线索的员工！");
      return;
    }
    if (selectedLeadIds.size === 0) {
      alert("未选择任何线索！");
      return;
    }
    setShowAssignModal(false);
    setShowConfirmModal(true);
  };

  const handleExecuteAssign = async () => {
    setLoading(true);
    try {
        const targetEmployee = allEmployees.find(e => e.id === assignTargetId);
        const empName = targetEmployee ? targetEmployee.name : '未知员工';

        await mockAssignLeadsToEmployee(Array.from(selectedLeadIds), assignTargetId);
        
        setShowConfirmModal(false);
        setSelectedLeadIds(new Set());
        setAssignTargetId('');
        
        await fetchData();
        showSuccess(`分配成功！已将 ${selectedLeadIds.size} 条线索分配给 ${empName}。`);
    } catch (error) {
        console.error(error);
        alert("分配失败，请稍后重试。");
    } finally {
        setLoading(false);
    }
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedLeadIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedLeadIds(newSet);
  };

  // --- Filter Logic ---
  const filteredLeads = leads.filter(l => {
    // 0. Search
    if (searchQuery) {
      if (!l.name.includes(searchQuery) && !l.phone.includes(searchQuery)) return false;
    }

    // 1. Recycled Filter
    if (filterRecycled) {
        return !!l.recycledAt;
    }
    
    // 2. Permission Based Filter
    if (!isSuperAdmin) {
      // Admins (not Super) can ONLY see UNASSIGNED leads
      return l.status === LeadStatus.UNASSIGNED;
    }

    // 3. Status Filter (For Super Admin)
    if (statusFilter !== 'ALL') {
        if (statusFilter === LeadStatus.ASSIGNED) {
            return l.status === LeadStatus.ASSIGNED || l.status === LeadStatus.FOLLOWING;
        }
        if (l.status !== statusFilter) return false;
    }
    
    return true;
  });

  // Pagination Logic
  const totalItems = filteredLeads.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const paginatedLeads = filteredLeads.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const getStatusLabel = (status: LeadStatus) => {
    switch (status) {
      case LeadStatus.UNASSIGNED: return '待分配';
      case LeadStatus.ASSIGNED: return '已分配';
      case LeadStatus.FOLLOWING: return '跟进中';
      case LeadStatus.DEAL: return '已成交';
      case LeadStatus.INVALID: return '无效';
      default: return status;
    }
  };

  const getOwnerName = (ownerId?: string) => {
    if (!ownerId) return '-';
    const emp = allEmployees.find(e => e.id === ownerId);
    return emp ? emp.name : '未知';
  };

  const getRecycleReasonLabel = (reason?: RecycleReason) => {
    if (reason === RecycleReason.EMPLOYEE_LEFT) return '员工离职回收';
    if (reason === RecycleReason.MANUAL) return '手动回收';
    return reason;
  };

  const targetEmployeeName = allEmployees.find(e => e.id === assignTargetId)?.name || '未知员工';

  return (
    <div className="p-8 relative">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-8 left-1/2 transform -translate-x-1/2 z-[70] flex items-center gap-2 px-6 py-3 rounded-full bg-green-600 text-white shadow-xl animate-bounce-in">
          <CheckCircle className="w-5 h-5" />
          <span className="font-medium">{notification.message}</span>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">线索公海池</h2>
          <p className="text-gray-500 text-sm">
            {isSuperAdmin ? '管理全平台线索资源（上帝视角）' : '待分配的公共线索资源'}
          </p>
        </div>
        <div className="flex gap-3">
          {isSuperAdmin && (
            <button 
              onClick={handleCreate}
              disabled={loading}
              className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium disabled:opacity-50"
            >
              <Plus className="w-4 h-4 mr-2" />
              新建线索
            </button>
          )}
          <button 
            onClick={handleOpenImport}
            disabled={loading}
            className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium disabled:opacity-50"
          >
            <UploadCloud className="w-4 h-4 mr-2" />
            导入线索
          </button>
          <button 
            onClick={handleAutoAssign}
            disabled={loading}
            className="flex items-center px-4 py-2 bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg hover:bg-indigo-200 text-sm font-medium disabled:opacity-50"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            一键自动分配
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-wrap flex-1">
          {/* Search Input */}
          <div className="relative">
             <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
             <input 
               type="text" 
               placeholder="搜索姓名或手机号..." 
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               className="pl-9 pr-4 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500 w-60"
             />
          </div>

          <div className="h-6 w-px bg-gray-200 hidden md:block"></div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">筛选:</span>
          </div>

          {/* Status Filter */}
          {isSuperAdmin ? (
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="text-sm border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 py-1.5 pl-2 pr-8 shadow-sm"
              disabled={filterRecycled}
            >
              <option value={LeadStatus.UNASSIGNED}>仅看待分配</option>
              <option value="ALL">全部线索 (上帝视角)</option>
              <option value={LeadStatus.ASSIGNED}>已分配 (含跟进中)</option>
            </select>
          ) : (
            <div className="px-3 py-1 bg-gray-100 rounded text-sm text-gray-600 border border-gray-200">
              公共待分配线索
            </div>
          )}

          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none border-l pl-4 border-gray-200">
            <input 
              type="checkbox" 
              checked={filterRecycled} 
              onChange={e => setFilterRecycled(e.target.checked)}
              className="rounded text-indigo-600 focus:ring-indigo-500" 
            />
            仅显示回收
          </label>
        </div>

        {selectedLeadIds.size > 0 && (
          <div className="flex items-center gap-4 bg-indigo-50 px-4 py-2 rounded-md">
            <span className="text-sm font-medium text-indigo-700">已选中 {selectedLeadIds.size} 条</span>
            <button 
              onClick={() => setShowAssignModal(true)}
              className="text-sm bg-indigo-600 text-white px-3 py-1.5 rounded-md hover:bg-indigo-700 shadow-sm"
            >
              分配给员工
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200 flex flex-col">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-10">
                  <input 
                    type="checkbox" 
                    onChange={(e) => {
                      if(e.target.checked) setSelectedLeadIds(new Set(paginatedLeads.map(l => l.id)));
                      else setSelectedLeadIds(new Set());
                    }}
                    checked={paginatedLeads.length > 0 && Array.from(selectedLeadIds).filter(id => paginatedLeads.find(l => l.id === id)).length === paginatedLeads.length}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">线索信息</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">地区</th>
                {isSuperAdmin && (
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">归属人</th>
                )}
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">来源/批次</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">创建时间</th>
                {isSuperAdmin && (
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedLeads.length === 0 ? (
                <tr><td colSpan={isSuperAdmin ? 8 : 7} className="px-6 py-12 text-center text-gray-500">
                  {searchQuery ? '未找到匹配的线索。' : '公海池暂无数据。'}
                </td></tr>
              ) : (
                paginatedLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input 
                        type="checkbox" 
                        checked={selectedLeadIds.has(lead.id)}
                        onChange={() => toggleSelect(lead.id)}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div 
                        className="text-sm font-medium text-indigo-600 cursor-pointer hover:underline"
                        onClick={() => handleViewDetails(lead)}
                      >
                        {lead.name}
                      </div>
                      <div className="text-sm text-gray-500">{lead.phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                       <div className="text-sm text-gray-700">{lead.region || '-'}</div>
                    </td>
                    {isSuperAdmin && (
                      <td className="px-6 py-4 whitespace-nowrap">
                         <div className={`text-sm flex items-center ${lead.ownerId ? 'text-indigo-600 font-medium' : 'text-gray-400'}`}>
                           {getOwnerName(lead.ownerId)}
                         </div>
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{lead.source}</div>
                      <div className="text-xs text-gray-400">{lead.batchId}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${lead.status === LeadStatus.UNASSIGNED ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>
                        {getStatusLabel(lead.status)}
                      </span>
                      {lead.recycledAt && (
                         <div className="text-[10px] text-red-500 mt-1">{getRecycleReasonLabel(lead.recycleReason)}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(lead.createdAt).toLocaleDateString()}
                    </td>
                    {isSuperAdmin && (
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                           <button onClick={() => handleViewDetails(lead)} className="text-gray-400 hover:text-indigo-600" title="查看详情">
                             <Eye className="w-4 h-4" />
                           </button>
                           <button onClick={() => handleEdit(lead)} className="text-gray-400 hover:text-blue-600" title="编辑">
                             <Edit className="w-4 h-4" />
                           </button>
                           <button onClick={() => handleDeleteClick(lead.id)} className="text-gray-400 hover:text-red-600" title="删除">
                             <Trash2 className="w-4 h-4" />
                           </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalItems > 0 && (
          <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex items-center justify-between">
             <div className="text-sm text-gray-500">
               显示第 <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span> 到 <span className="font-medium">{Math.min(currentPage * pageSize, totalItems)}</span> 条，共 <span className="font-medium">{totalItems}</span> 条
             </div>
             <div className="flex gap-2">
               <button 
                 onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                 disabled={currentPage === 1}
                 className="p-1 rounded-md border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
               >
                 <ChevronLeft className="w-5 h-5" />
               </button>
               <div className="flex items-center gap-1">
                 {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-8 h-8 flex items-center justify-center rounded-md text-sm font-medium transition-colors ${
                        currentPage === page 
                          ? 'bg-indigo-600 text-white' 
                          : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                 ))}
               </div>
               <button 
                 onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                 disabled={currentPage === totalPages}
                 className="p-1 rounded-md border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
               >
                 <ChevronRight className="w-5 h-5" />
               </button>
             </div>
          </div>
        )}
      </div>

      {/* --- MODALS --- */}

      {/* 1. Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[400px] shadow-xl relative">
             <button onClick={() => setShowImportModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
             <h3 className="text-lg font-bold mb-1">导入线索</h3>
             <p className="text-sm text-gray-500 mb-6">上传 Excel/CSV 批量导入</p>
             <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:bg-gray-50 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
               <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx,.xls,.csv" onChange={handleFileChange} />
               <UploadCloud className="w-10 h-10 text-gray-400 mx-auto mb-3" />
               <div className="text-sm text-gray-500">{selectedFile ? selectedFile.name : '点击上传文件'}</div>
             </div>
             <div className="flex justify-end gap-3 mt-6">
               <button onClick={handleExecuteImport} disabled={!selectedFile || loading} className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-md disabled:opacity-50">开始导入</button>
             </div>
          </div>
        </div>
      )}

      {/* 2. Create/Edit Lead Modal */}
      {showCreateModal && editingLead && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[500px] shadow-xl relative">
            <button onClick={() => setShowCreateModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            <h3 className="text-lg font-bold mb-4">{editingLead.id ? '编辑线索' : '新建线索'}</h3>
            <form onSubmit={handleSaveLead} className="space-y-4">
               <div>
                 <label className="block text-sm font-medium text-gray-700">姓名</label>
                 <input required type="text" value={editingLead.name || ''} onChange={e => setEditingLead({...editingLead, name: e.target.value})} className="mt-1 w-full border border-gray-300 rounded-md p-2" />
               </div>
               <div>
                 <label className="block text-sm font-medium text-gray-700">电话</label>
                 <input required type="text" value={editingLead.phone || ''} onChange={e => setEditingLead({...editingLead, phone: e.target.value})} className="mt-1 w-full border border-gray-300 rounded-md p-2" />
               </div>
               <div>
                 <label className="block text-sm font-medium text-gray-700">地区</label>
                 <input type="text" value={editingLead.region || ''} onChange={e => setEditingLead({...editingLead, region: e.target.value})} className="mt-1 w-full border border-gray-300 rounded-md p-2" />
               </div>
               <div>
                 <label className="block text-sm font-medium text-gray-700">来源</label>
                 <input type="text" value={editingLead.source || ''} onChange={e => setEditingLead({...editingLead, source: e.target.value})} className="mt-1 w-full border border-gray-300 rounded-md p-2" />
               </div>
               <div className="flex justify-end gap-3 pt-4">
                 <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-sm border border-gray-300 rounded-md">取消</button>
                 <button type="submit" disabled={loading} className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-md">{loading ? '保存中...' : '保存'}</button>
               </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Detail/View Modal */}
      {showDetailModal && viewingLead && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-[600px] max-h-[80vh] shadow-xl flex flex-col relative">
            <div className="p-6 border-b border-gray-100 flex justify-between items-start">
               <div>
                 <h2 className="text-xl font-bold text-gray-800">{viewingLead.name}</h2>
                 <p className="text-sm text-gray-500 mt-1 flex items-center"><Phone className="w-3 h-3 mr-1"/>{viewingLead.phone}</p>
               </div>
               <button onClick={() => setShowDetailModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
               <div className="grid grid-cols-2 gap-4 mb-6">
                 <div className="bg-gray-50 p-3 rounded-lg">
                    <span className="text-xs text-gray-500 block">状态</span>
                    <span className="font-medium text-gray-800">{getStatusLabel(viewingLead.status)}</span>
                 </div>
                 <div className="bg-gray-50 p-3 rounded-lg">
                    <span className="text-xs text-gray-500 block">归属人</span>
                    <span className="font-medium text-gray-800">{getOwnerName(viewingLead.ownerId)}</span>
                 </div>
                 <div className="bg-gray-50 p-3 rounded-lg">
                    <span className="text-xs text-gray-500 block">地区</span>
                    <span className="font-medium text-gray-800">{viewingLead.region || '-'}</span>
                 </div>
                 <div className="bg-gray-50 p-3 rounded-lg">
                    <span className="text-xs text-gray-500 block">来源</span>
                    <span className="font-medium text-gray-800">{viewingLead.source}</span>
                 </div>
               </div>

               <h3 className="font-bold text-gray-800 mb-4 flex items-center">
                 <Clock className="w-4 h-4 mr-2" /> 跟进记录
               </h3>
               
               <div className="space-y-6">
                  {viewingFollowUps.length === 0 ? (
                    <p className="text-sm text-gray-400 italic">暂无跟进记录。</p>
                  ) : (
                    viewingFollowUps.map(fu => (
                      <div key={fu.id} className="relative pl-8 pb-4 border-l-2 border-gray-100 last:border-0">
                        <div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-blue-100 border-2 border-white"></div>
                        <div className="text-xs text-gray-400 mb-1">{new Date(fu.createdAt).toLocaleString()}</div>
                        <div className="text-gray-800 text-sm bg-gray-50 p-3 rounded-lg border border-gray-100">
                          {fu.content}
                        </div>
                      </div>
                    ))
                  )}
               </div>
            </div>
            
            <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-lg flex justify-end">
               <button onClick={() => setShowDetailModal(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 bg-white rounded-md hover:bg-gray-50">关闭</button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Assign Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 shadow-xl">
            <h3 className="text-lg font-bold mb-4">分配 {selectedLeadIds.size} 条线索</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">选择员工</label>
              <select 
                value={assignTargetId}
                onChange={(e) => setAssignTargetId(e.target.value)}
                className="w-full border border-gray-300 rounded-md p-2"
              >
                <option value="">-- 请选择 --</option>
                {assignableEmployees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name} (当前: {emp.assignedLeadsCount})</option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowAssignModal(false)} className="px-4 py-2 text-sm border rounded-md">取消</button>
              <button onClick={handlePreAssign} className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-md">下一步</button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Assign Confirm Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg p-6 w-96 shadow-xl border-t-4 border-indigo-500">
            <div className="flex items-center gap-3 text-gray-800 mb-4">
              <AlertTriangle className="w-6 h-6 text-indigo-500" />
              <h3 className="text-lg font-bold">请确认分配操作</h3>
            </div>
            <div className="bg-gray-50 p-4 rounded-md mb-6 text-sm text-gray-600">
              <p>即将把 <strong>{selectedLeadIds.size}</strong> 条线索分配给 <strong>{targetEmployeeName}</strong>。</p>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => { setShowConfirmModal(false); setShowAssignModal(true); }} className="px-4 py-2 text-sm border rounded-md">返回修改</button>
              <button onClick={handleExecuteAssign} disabled={loading} className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-md">确认分配</button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Delete Confirm Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70]">
          <div className="bg-white rounded-lg p-6 w-96 shadow-xl border-t-4 border-red-500">
            <div className="flex items-center gap-3 text-gray-800 mb-4">
              <Trash2 className="w-6 h-6 text-red-500" />
              <h3 className="text-lg font-bold">确认删除线索？</h3>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              此操作将永久删除该线索，删除后无法恢复。请确认是否继续。
            </p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => { setShowDeleteModal(false); setDeleteTargetId(null); }} 
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
import React, { useEffect, useState } from 'react';
import { Lead, LeadStatus, FollowUp } from '../types';
import { mockListLeads, mockGetFollowUps, mockAddFollowUp, mockUpdateLeadStatus } from '../mock/api';
import { Phone, Clock, MessageSquare, CheckCircle, XCircle } from 'lucide-react';

interface MyLeadsProps {
  currentUserId: string;
}

export const MyLeads: React.FC<MyLeadsProps> = ({ currentUserId }) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(false);
  const [newNote, setNewNote] = useState('');

  const fetchLeads = async () => {
    setLoading(true);
    const data = await mockListLeads({ ownerId: currentUserId });
    setLeads(data.filter(l => l.status !== LeadStatus.DEAL && l.status !== LeadStatus.INVALID));
    setLoading(false);
  };

  useEffect(() => {
    fetchLeads();
  }, [currentUserId]);

  const handleSelectLead = async (lead: Lead) => {
    setSelectedLead(lead);
    setNewNote('');
    // Mock fetch followups
    const history = await mockGetFollowUps(lead.id);
    setFollowUps(history);
  };

  const handleStatusChange = async (newStatus: LeadStatus) => {
    if (!selectedLead) return;
    
    let dealName = '';
    if (newStatus === LeadStatus.DEAL) {
      dealName = prompt("恭喜成交！请输入成交客户名称：", selectedLead.name) || selectedLead.name;
    }

    if (newStatus === LeadStatus.INVALID) {
      if (!confirm("确定标记为无效线索吗？标记后将从您的列表移除。")) return;
    }

    await mockUpdateLeadStatus(selectedLead.id, newStatus, { name: dealName });
    await fetchLeads();
    setSelectedLead(null); // Deselect as it might disappear from list
    alert(newStatus === LeadStatus.DEAL ? '已转为成交客户！' : '状态已更新');
  };

  const handleSubmitNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead || !newNote.trim()) return;
    
    await mockAddFollowUp(selectedLead.id, currentUserId, newNote);
    
    // Auto status update to FOLLOWING if it was ASSIGNED
    if (selectedLead.status === LeadStatus.ASSIGNED) {
      await mockUpdateLeadStatus(selectedLead.id, LeadStatus.FOLLOWING);
    }

    setNewNote('');
    const updatedHistory = await mockGetFollowUps(selectedLead.id);
    setFollowUps(updatedHistory);
    // Refresh leads to update timestamps or status
    fetchLeads();
  };

  const getStatusLabel = (status: LeadStatus) => {
    switch (status) {
      case LeadStatus.ASSIGNED: return '待跟进';
      case LeadStatus.FOLLOWING: return '跟进中';
      default: return status;
    }
  };

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">
      {/* List Column */}
      <div className="w-1/3 border-r border-gray-200 bg-white overflow-y-auto">
        <div className="p-4 border-b border-gray-100 bg-gray-50 sticky top-0">
          <h2 className="font-bold text-gray-700">我的待办列表 ({leads.length})</h2>
        </div>
        <div>
          {leads.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              暂无待办线索，请联系管理员分配。
            </div>
          ) : (
            leads.map(lead => (
              <div 
                key={lead.id}
                onClick={() => handleSelectLead(lead)}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-blue-50 transition-colors ${selectedLead?.id === lead.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-medium text-gray-900">{lead.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${lead.status === 'FOLLOWING' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                    {getStatusLabel(lead.status)}
                  </span>
                </div>
                <div className="flex items-center text-sm text-gray-500 mb-2">
                  <Phone className="w-3 h-3 mr-1" /> {lead.phone}
                </div>
                <div className="text-xs text-gray-400">
                  更新时间: {new Date(lead.updatedAt).toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Detail Column */}
      <div className="flex-1 bg-gray-50 overflow-y-auto p-6">
        {selectedLead ? (
          <div className="max-w-2xl mx-auto">
            {/* Header Card */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">{selectedLead.name}</h1>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center"><Phone className="w-4 h-4 mr-1"/> {selectedLead.phone}</span>
                    <span className="bg-gray-100 px-2 py-0.5 rounded">来源: {selectedLead.source}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleStatusChange(LeadStatus.DEAL)}
                    className="flex items-center px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" /> 转成交
                  </button>
                  <button 
                    onClick={() => handleStatusChange(LeadStatus.INVALID)}
                    className="flex items-center px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition"
                  >
                    <XCircle className="w-4 h-4 mr-2" /> 标记无效
                  </button>
                </div>
              </div>
            </div>

            {/* Timeline / FollowUp */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center">
                <Clock className="w-4 h-4 mr-2" /> 跟进记录
              </h3>
              
              {/* Input */}
              <form onSubmit={handleSubmitNote} className="mb-8">
                <textarea
                  value={newNote}
                  onChange={e => setNewNote(e.target.value)}
                  placeholder="记录通话摘要或下一步计划..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none h-24"
                ></textarea>
                <div className="flex justify-end mt-2">
                  <button 
                    type="submit"
                    disabled={!newNote.trim()}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm font-medium disabled:opacity-50"
                  >
                    添加跟进记录
                  </button>
                </div>
              </form>

              {/* List */}
              <div className="space-y-6">
                {followUps.map(fu => (
                  <div key={fu.id} className="relative pl-8 pb-4 border-l-2 border-gray-100 last:border-0">
                    <div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-blue-100 border-2 border-white"></div>
                    <div className="text-xs text-gray-400 mb-1">{new Date(fu.createdAt).toLocaleString()}</div>
                    <div className="text-gray-800 text-sm bg-gray-50 p-3 rounded-lg border border-gray-100">
                      {fu.content}
                    </div>
                  </div>
                ))}
                {followUps.length === 0 && <p className="text-gray-400 text-sm text-center">暂无跟进记录。</p>}
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-gray-400">
            <MessageSquare className="w-16 h-16 mb-4 opacity-20" />
            <p>请从左侧选择一个线索开始跟进</p>
          </div>
        )}
      </div>
    </div>
  );
};
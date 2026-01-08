import { 
  Employee, 
  Lead, 
  FollowUp, 
  Customer, 
  Role, 
  EmployeeStatus, 
  LeadStatus, 
  RecycleReason 
} from '../types';

// --- Initial Data (Defaults if storage is empty) ---

const MOCK_EMPLOYEES: Employee[] = [
  { id: 'emp_001', name: '周总 (超管)', email: 'zhou@crm.com', role: Role.SUPER_ADMIN, status: EmployeeStatus.ACTIVE },
  { id: 'emp_002', name: '罗经理 (管理员)', email: 'luo@crm.com', role: Role.ADMIN, status: EmployeeStatus.ACTIVE },
  { id: 'emp_003', name: '张三 (销售)', email: 'zhangsan@crm.com', role: Role.EMPLOYEE, status: EmployeeStatus.ACTIVE },
  { id: 'emp_004', name: '李四 (销售)', email: 'lisi@crm.com', role: Role.EMPLOYEE, status: EmployeeStatus.ACTIVE },
  { id: 'emp_005', name: '王五 (已离职)', email: 'wangwu@crm.com', role: Role.EMPLOYEE, status: EmployeeStatus.INACTIVE, leftAt: '2023-10-01T10:00:00Z' },
];

const MOCK_LEADS: Lead[] = [
  // Unassigned Pool
  { id: 'lead_101', name: '陈总', phone: '13800138000', source: '官网注册', batchId: '批次001', status: LeadStatus.UNASSIGNED, createdAt: '2023-10-25T09:00:00Z', updatedAt: '2023-10-25T09:00:00Z', region: '北京' },
  { id: 'lead_104', name: '孙女士', phone: '15000150000', source: '官网注册', batchId: '批次002', status: LeadStatus.UNASSIGNED, createdAt: '2023-10-28T09:00:00Z', updatedAt: '2023-10-28T09:00:00Z', region: '上海' },
  
  // Assigned to Sales (emp_003, emp_004)
  { id: 'lead_102', name: '刘经理', phone: '13900139000', source: '朋友介绍', batchId: '批次001', status: LeadStatus.ASSIGNED, ownerId: 'emp_003', createdAt: '2023-10-26T10:00:00Z', updatedAt: '2023-10-26T11:00:00Z', region: '广州' },
  { id: 'lead_103', name: '赵先生', phone: '13700137000', source: '广告投放', batchId: '批次002', status: LeadStatus.FOLLOWING, ownerId: 'emp_003', createdAt: '2023-10-27T14:00:00Z', updatedAt: '2023-10-27T15:30:00Z', region: '深圳' },
  { id: 'lead_105', name: '周总监', phone: '19900199000', source: '线下活动', batchId: '批次003', status: LeadStatus.ASSIGNED, ownerId: 'emp_004', createdAt: '2023-10-28T16:00:00Z', updatedAt: '2023-10-28T16:00:00Z', region: '杭州' },

  // Assigned to Admin/Super Admin (So they see data in "My Leads" immediately)
  { id: 'lead_106', name: '测试-超管专属线索', phone: '13300000001', source: '系统测试', batchId: '内部测试', status: LeadStatus.ASSIGNED, ownerId: 'emp_001', createdAt: '2023-11-01T09:00:00Z', updatedAt: '2023-11-01T09:00:00Z', region: '总部' },
  { id: 'lead_107', name: '测试-管理员线索A', phone: '13300000002', source: '系统测试', batchId: '内部测试', status: LeadStatus.FOLLOWING, ownerId: 'emp_002', createdAt: '2023-11-01T10:00:00Z', updatedAt: '2023-11-01T10:00:00Z', region: '成都' },
];

const MOCK_FOLLOWUPS: FollowUp[] = [
  { id: 'fu_01', leadId: 'lead_103', ownerId: 'emp_003', content: '电话无人接听，稍后回访。', createdAt: '2023-10-27T15:30:00Z' }
];

const MOCK_CUSTOMERS: Customer[] = [];

// --- Persistence Helpers ---

const STORAGE_KEY = 'crm_mock_db_v3'; // Increment version to ensure new schema/logic loads

const loadFromStorage = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Failed to load mock data", e);
  }
  return null;
};

const saveToStorage = () => {
  try {
    const data = { employees, leads, followUps, customers };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("Failed to save mock data", e);
  }
};

// --- In-Memory Store Initialization ---

let employees: Employee[] = [];
let leads: Lead[] = [];
let followUps: FollowUp[] = [];
let customers: Customer[] = [];

const initStore = () => {
  const data = loadFromStorage();
  if (data && data.employees && data.employees.length > 0) {
    employees = data.employees;
    leads = data.leads;
    followUps = data.followUps;
    customers = data.customers;
  } else {
    // Load defaults
    employees = [...MOCK_EMPLOYEES];
    leads = [...MOCK_LEADS];
    followUps = [...MOCK_FOLLOWUPS];
    customers = [...MOCK_CUSTOMERS];
    saveToStorage();
  }
};

// Initialize immediately
initStore();

// --- Helpers ---

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const randomDelay = () => delay(Math.floor(Math.random() * 300) + 100);

// --- API Methods ---

// 1. Employee Management
export const mockListEmployees = async (): Promise<Employee[]> => {
  await randomDelay();
  // Return fresh data from memory (which is synced with storage)
  return employees.map(emp => ({
    ...emp,
    assignedLeadsCount: leads.filter(l => l.ownerId === emp.id && l.status !== LeadStatus.DEAL && l.status !== LeadStatus.INVALID).length,
    customerCount: customers.filter(c => c.ownerId === emp.id).length
  }));
};

export const mockCreateEmployee = async (empData: Partial<Employee>): Promise<Employee> => {
  await randomDelay();
  const newEmp: Employee = {
    id: `emp_new_${Date.now()}`,
    name: empData.name || '新员工',
    email: empData.email || 'new@crm.com',
    role: empData.role || Role.EMPLOYEE,
    status: empData.status || EmployeeStatus.ACTIVE,
    ...empData
  } as Employee;
  employees = [...employees, newEmp];
  saveToStorage();
  return newEmp;
};

export const mockUpdateEmployee = async (id: string, updates: Partial<Employee>): Promise<void> => {
  await randomDelay();
  employees = employees.map(e => e.id === id ? { ...e, ...updates } : e);
  saveToStorage();
};

export const mockActivateEmployee = async (employeeId: string): Promise<void> => {
  await randomDelay();
  employees = employees.map(e => e.id === employeeId ? { ...e, status: EmployeeStatus.ACTIVE, leftAt: undefined } : e);
  saveToStorage();
};

export const mockDeactivateEmployee = async (employeeId: string): Promise<{ recycledLeadCount: number }> => {
  await randomDelay();
  const now = new Date().toISOString();
  let recycledCount = 0;

  // 1. Deactivate Employee
  employees = employees.map(e => e.id === employeeId ? { ...e, status: EmployeeStatus.INACTIVE, leftAt: now } : e);

  // 2. Recycle Leads
  leads = leads.map(lead => {
    // Recycle ASSIGNED or FOLLOWING leads owned by this employee
    const isActiveLead = lead.status !== LeadStatus.DEAL && lead.status !== LeadStatus.INVALID;
    if (lead.ownerId === employeeId && isActiveLead) {
      recycledCount++;
      return {
        ...lead,
        ownerId: undefined,
        status: LeadStatus.UNASSIGNED,
        recycledAt: now,
        recycleReason: RecycleReason.EMPLOYEE_LEFT,
        updatedAt: now,
      };
    }
    return lead;
  });

  saveToStorage();
  return { recycledLeadCount: recycledCount };
};

export const mockDeleteEmployee = async (id: string): Promise<void> => {
  await randomDelay();
  employees = employees.filter(e => e.id !== id);
  // Note: In a real system, we should probably check for dependent data first.
  saveToStorage();
};

// 2. Lead Management
export const mockListLeads = async (filters?: { ownerId?: string; status?: LeadStatus }): Promise<Lead[]> => {
  await randomDelay();
  let result = [...leads];
  
  if (filters?.ownerId) {
    result = result.filter(l => l.ownerId === filters.ownerId);
  }
  
  if (filters?.status) {
    result = result.filter(l => l.status === filters.status);
  }

  // Sort by updatedAt desc
  return result.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
};

// NEW: Create a single lead
export const mockCreateLead = async (leadData: Partial<Lead>): Promise<Lead> => {
  await randomDelay();
  const now = new Date().toISOString();
  const newLead: Lead = {
    id: `lead_manual_${Date.now()}`,
    name: leadData.name || '未命名',
    phone: leadData.phone || '',
    source: leadData.source || '手动录入',
    batchId: '手动录入',
    region: leadData.region || '',
    status: LeadStatus.UNASSIGNED,
    createdAt: now,
    updatedAt: now,
    ...leadData
  } as Lead;
  
  leads = [newLead, ...leads];
  saveToStorage();
  return newLead;
};

// NEW: Update lead details (basic info)
export const mockUpdateLeadInfo = async (id: string, updates: Partial<Lead>): Promise<void> => {
  await randomDelay();
  const now = new Date().toISOString();
  const idx = leads.findIndex(l => l.id === id);
  if (idx === -1) throw new Error("Lead not found");

  leads[idx] = { ...leads[idx], ...updates, updatedAt: now };
  saveToStorage();
};

// NEW: Delete lead
export const mockDeleteLead = async (id: string): Promise<void> => {
  await randomDelay();
  leads = leads.filter(l => l.id !== id);
  // Also clean up related items ideally, but fine for prototype
  saveToStorage();
};

export const mockImportLeads = async (newLeadsData: Partial<Lead>[]): Promise<void> => {
  await randomDelay();
  const now = new Date().toISOString();
  const newLeads = newLeadsData.map((d, i) => ({
    ...d,
    id: `lead_new_${Date.now()}_${i}`,
    status: LeadStatus.UNASSIGNED,
    createdAt: now,
    updatedAt: now,
  } as Lead));
  
  leads = [...leads, ...newLeads];
  saveToStorage();
};

export const mockAssignLeadsToEmployee = async (leadIds: string[], employeeId: string): Promise<void> => {
  await randomDelay();
  const now = new Date().toISOString();
  
  leads = leads.map(l => {
    if (leadIds.includes(l.id)) {
      return {
        ...l,
        ownerId: employeeId,
        status: LeadStatus.ASSIGNED, // Force status to ASSIGNED
        updatedAt: now,
        recycleReason: undefined, 
        recycledAt: undefined
      };
    }
    return l;
  });
  
  saveToStorage();
};

export const mockAutoAssignLeads = async (): Promise<{ assignedCount: number }> => {
  await randomDelay();
  const activeEmployees = employees.filter(e => e.status === EmployeeStatus.ACTIVE && e.role === Role.EMPLOYEE);
  const unassignedLeads = leads.filter(l => l.status === LeadStatus.UNASSIGNED);
  
  if (activeEmployees.length === 0 || unassignedLeads.length === 0) {
    return { assignedCount: 0 };
  }

  const now = new Date().toISOString();
  let assignedCount = 0;

  // Round-robin assignment
  const updatedLeads = [...leads];
  unassignedLeads.forEach((lead, index) => {
    const targetEmp = activeEmployees[index % activeEmployees.length];
    
    // Find index in original array
    const leadIndex = updatedLeads.findIndex(l => l.id === lead.id);
    if (leadIndex !== -1) {
      updatedLeads[leadIndex] = {
        ...updatedLeads[leadIndex],
        ownerId: targetEmp.id,
        status: LeadStatus.ASSIGNED,
        updatedAt: now,
        recycleReason: undefined,
        recycledAt: undefined
      };
      assignedCount++;
    }
  });

  leads = updatedLeads;
  saveToStorage();
  return { assignedCount };
};

export const mockUpdateLeadStatus = async (leadId: string, status: LeadStatus, dealData?: {name: string}): Promise<void> => {
  await randomDelay();
  const now = new Date().toISOString();
  const lead = leads.find(l => l.id === leadId);
  
  if (!lead) throw new Error("Lead not found");

  leads = leads.map(l => l.id === leadId ? { ...l, status, updatedAt: now } : l);

  // If DEAL, create Customer
  if (status === LeadStatus.DEAL && dealData) {
    customers.push({
      id: `cust_${Date.now()}`,
      leadId: lead.id,
      name: dealData.name || lead.name,
      phone: lead.phone,
      ownerId: lead.ownerId,
      dealAt: now,
      updatedAt: now,
      tags: [],
    });
  }
  saveToStorage();
};

// 3. Follow Ups
export const mockGetFollowUps = async (leadId: string): Promise<FollowUp[]> => {
  await randomDelay();
  return followUps.filter(f => f.leadId === leadId).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const mockAddFollowUp = async (leadId: string, ownerId: string, content: string): Promise<FollowUp> => {
  await randomDelay();
  const newFu: FollowUp = {
    id: `fu_${Date.now()}`,
    leadId,
    ownerId,
    content,
    createdAt: new Date().toISOString()
  };
  followUps = [newFu, ...followUps];
  
  // Also update lead updated_at
  leads = leads.map(l => l.id === leadId ? { ...l, updatedAt: new Date().toISOString() } : l);
  
  saveToStorage();
  return newFu;
};
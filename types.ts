export enum Role {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  EMPLOYEE = 'EMPLOYEE',
}

export enum EmployeeStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export interface Employee {
  id: string;
  name: string;
  role: Role;
  status: EmployeeStatus;
  email: string;
  leftAt?: string; // ISO Date string
  assignedLeadsCount?: number; // Mock aggregate
  customerCount?: number; // Mock aggregate
}

export enum LeadStatus {
  UNASSIGNED = 'UNASSIGNED', // In pool
  ASSIGNED = 'ASSIGNED',     // Assigned to emp
  FOLLOWING = 'FOLLOWING',   // Being worked on
  DEAL = 'DEAL',             // Converted
  INVALID = 'INVALID',       // Trash
}

export enum RecycleReason {
  EMPLOYEE_LEFT = 'EMPLOYEE_LEFT',
  MANUAL = 'MANUAL',
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  source: string;
  batchId: string;
  status: LeadStatus;
  region?: string; // New field for region
  ownerId?: string; // undefined if UNASSIGNED
  createdAt: string;
  updatedAt: string;
  recycledAt?: string;
  recycleReason?: RecycleReason;
  notes?: string;
}

export interface FollowUp {
  id: string;
  leadId: string;
  ownerId: string;
  content: string;
  createdAt: string;
  nextFollowUpAt?: string;
}

export interface Customer {
  id: string;
  leadId: string;
  name: string;
  phone: string;
  ownerId?: string;
  dealAt: string;
  updatedAt: string;
  tags: string[];
  recycledAt?: string;
}

// For UI state
export interface UserSession {
  id: string;
  name: string;
  role: Role;
}
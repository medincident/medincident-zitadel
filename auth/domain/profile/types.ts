export interface User {
  info: PersonalInfo
  linkedAccounts: LinkedAccountsStatus
}

export interface PersonalInfo {
  id: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  email: string;
  isEmailVerified: boolean;
  position: string;
  avatarUrl?: string;
  roles: string[];
  organizationName?: string;
  clinicName?: string;
  departmentName?: string;
}

export interface LinkedAccountsStatus {
  telegram: boolean;
  max: boolean;
}

export interface UserSession {
  id: string;
  deviceName: string;
  userAgent: string;
  ip: string;
  lastActive: Date;
  isCurrent: boolean;
}

export interface SecurityData {
  sessions: UserSession[];
}
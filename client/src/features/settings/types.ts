export interface BusinessProfile {
  id: number;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  logo?: string;
}

export interface SystemSetting {
  id: number;
  key: string;
  value: string;
  description?: string;
}

export interface UserRole {
  id: number;
  name: string;
  permissions: string[];
}
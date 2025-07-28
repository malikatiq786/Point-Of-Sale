export interface BusinessProfile {
  id: number;
  businessName: string;
  businessType: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  taxId: string;
  website?: string;
  logo?: string;
  description?: string;
}

export interface Branch {
  id: number;
  name: string;
  code: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  phone: string;
  email: string;
  managerId?: string;
  isActive: boolean;
  businessProfileId: number;
}

export interface Register {
  id: number;
  name: string;
  code: string;
  branchId: number;
  isActive: boolean;
  openingBalance: number;
  currentBalance: number;
  lastOpened?: Date;
  lastClosed?: Date;
}
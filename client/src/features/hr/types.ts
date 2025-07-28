export interface Employee {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  position?: string;
  salary?: number;
  hireDate?: string;
}

export interface Attendance {
  id: number;
  employeeId: number;
  date: string;
  checkIn?: string;
  checkOut?: string;
  status: 'present' | 'absent' | 'late';
}

export interface Salary {
  id: number;
  employeeId: number;
  amount: number;
  month: string;
  year: number;
  paidDate?: string;
}
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role?: {
    id: number;
    name: string;
  };
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}
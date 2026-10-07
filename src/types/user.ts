import { ClassLevel } from './paper';

export type UserRole = 'admin' | 'principal' | 'teacher';

export interface SchoolBranch {
  id: string;
  name: string; // e.g. "Pakpattan Branch", "Okara Branch", "Main Campus"
  address?: string;
  phone?: string;
  city?: string;
}

export interface UserAccount {
  id: string;
  username: string; // Login ID (e.g. principal_lahore or school_unique)
  password: string; // Plain/hashed password for school login
  role: UserRole;
  name: string; // Principal / Admin name
  schoolName: string;
  campusName: string;
  branches?: SchoolBranch[];
  activeBranchId?: string;
  logoUrl?: string; // School Monogram (Base64 data or URL)
  phone?: string;
  city?: string;
  targetBoard: string; // e.g. "lahore", "sahiwal", "faisalabad", etc.
  allowedClasses: ClassLevel[];
  status: 'active' | 'suspended';
  expiryDate: string; // e.g. "2027-12-31"
  paperLimit: number; // e.g. 500 or 9999 (unlimited)
  papersCreated: number;
  createdAt: string;
}

export interface AuthSession {
  user: UserAccount | null;
  token?: string;
  isAuthenticated: boolean;
}

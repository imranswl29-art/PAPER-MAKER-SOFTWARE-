import { UserAccount } from '../types/user';

export const INITIAL_ACCOUNTS: UserAccount[] = [
  {
    id: 'user-admin-01',
    username: 'admin',
    password: 'admin',
    role: 'admin',
    name: 'Muhammad Imran Khan (MSc Computer Science)',
    schoolName: 'Punjab Board Examination Central Portal',
    campusName: 'Central Admin Office, Lahore',
    city: 'Lahore',
    phone: '03007603964',
    targetBoard: 'lahore',
    allowedClasses: ['9th', '10th'],
    status: 'active',
    expiryDate: '2030-12-31',
    paperLimit: 99999,
    papersCreated: 0,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
];


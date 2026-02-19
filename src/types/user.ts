import { Role } from './role';

export interface User {
  id: string;
  displayName: string;
  email: string;
  role: Role;
  photoURL?: string;
  createdAt: string; // ISO
}

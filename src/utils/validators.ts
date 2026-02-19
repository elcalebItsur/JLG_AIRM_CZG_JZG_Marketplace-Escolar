import { isStudentEmail, isTeacherEmail } from '../constants/validation';
import { Role } from '../types/role';

export function deriveRoleFromEmail(email: string): Role | null {
  if (isStudentEmail(email)) return Role.STUDENT;
  if (isTeacherEmail(email)) return Role.TEACHER;
  return null;
}

export function validateEmailDomainForRegistration(email: string): { ok: boolean; message?: string } {
  const role = deriveRoleFromEmail(email);
  if (!role) return { ok: false, message: 'El correo no pertenece a un dominio institucional válido.' };
  return { ok: true };
}

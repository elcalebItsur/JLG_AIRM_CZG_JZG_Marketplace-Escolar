import { deriveRoleFromEmail, validateEmailDomainForRegistration } from '../utils/validators';
import { User } from '../types/user';
import { Role } from '../types/role';

/**
 * authService: capa de servicio para autenticación.
 * Implementación MVP: valida dominio y prepara payload para backend.
 * Integrar con Firebase Auth o Supabase en FASE 5.
 */

export async function registerUser(email: string, password: string, displayName: string): Promise<{ user?: User; error?: string }> {
  const validation = validateEmailDomainForRegistration(email);
  if (!validation.ok) return { error: validation.message };

  const role = deriveRoleFromEmail(email) as Role;

  // Placeholder: aquí se integrará con Firebase / Supabase
  // Por ahora devolvemos el objeto user simulado para UI local
  const fakeUser: User = {
    id: `local-${Date.now()}`,
    displayName,
    email,
    role,
    createdAt: new Date().toISOString(),
  };

  return { user: fakeUser };
}

export async function loginUser(email: string, password: string): Promise<{ user?: User; error?: string }> {
  // Placeholder: validar credenciales con backend
  // En FASE 5 se reemplaza por llamada real y token.
  return { error: 'Not implemented: integrar con backend en FASE 5' };
}

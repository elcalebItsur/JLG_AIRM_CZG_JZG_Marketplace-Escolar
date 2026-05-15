import { deriveRoleFromEmail, validateEmailDomainForRegistration } from '../validators';
import { Role } from '../../types/role';

describe('Validators Logic', () => {
  
  describe('deriveRoleFromEmail', () => {
    it('should return STUDENT for valid student emails', () => {
      expect(deriveRoleFromEmail('l20120123@alumnos.itsur.edu.mx')).toBe(Role.STUDENT);
      expect(deriveRoleFromEmail('TEST@ALUMNOS.ITSUR.EDU.MX')).toBe(Role.STUDENT);
    });

    it('should return TEACHER for valid teacher emails', () => {
      expect(deriveRoleFromEmail('docente@itsur.edu.mx')).toBe(Role.TEACHER);
      expect(deriveRoleFromEmail('PROFESOR@ITSUR.EDU.MX')).toBe(Role.TEACHER);
    });

    it('should return null for non-institutional emails', () => {
      expect(deriveRoleFromEmail('usuario@gmail.com')).toBeNull();
      expect(deriveRoleFromEmail('test@outlook.com')).toBeNull();
    });

    it('should return null for malformed institutional-like emails', () => {
      expect(deriveRoleFromEmail('@itsur.edu.mx')).toBeNull(); // No prefix
      expect(deriveRoleFromEmail('alumnos.itsur.edu.mx')).toBeNull(); // No @
    });
  });

  describe('validateEmailDomainForRegistration', () => {
    it('should validate correctly for institutional emails', () => {
      expect(validateEmailDomainForRegistration('estudiante@alumnos.itsur.edu.mx')).toEqual({ ok: true });
      expect(validateEmailDomainForRegistration('maestro@itsur.edu.mx')).toEqual({ ok: true });
    });

    it('should reject non-institutional emails with error message', () => {
      const result = validateEmailDomainForRegistration('hacker@externo.com');
      expect(result.ok).toBe(false);
      expect(result.message).toBe('El correo no pertenece a un dominio institucional válido.');
    });
  });

});

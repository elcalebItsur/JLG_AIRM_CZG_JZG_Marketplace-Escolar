export const STUDENT_DOMAIN = '@alumnos.itsur.edu.mx';
export const TEACHER_DOMAIN = '@itsur.edu.mx';

export const isStudentEmail = (email: string) => {
  const lower = email.toLowerCase();
  return lower.endsWith(STUDENT_DOMAIN) && lower.length > STUDENT_DOMAIN.length;
};

// Must explicitly exclude student emails since '@alumnos.itsur.edu.mx'
// also ends with '@itsur.edu.mx'
export const isTeacherEmail = (email: string) => {
  const lower = email.toLowerCase();
  return lower.endsWith(TEACHER_DOMAIN) && 
         !lower.endsWith(STUDENT_DOMAIN) && 
         lower.length > TEACHER_DOMAIN.length;
};

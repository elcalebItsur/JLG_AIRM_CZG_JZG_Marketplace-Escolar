export const STUDENT_DOMAIN = '@alumnos.itsur.edu.mx';
export const TEACHER_DOMAIN = '@itsur.edu.mx';

export const isStudentEmail = (email: string) =>
  email.toLowerCase().endsWith(STUDENT_DOMAIN);

export const isTeacherEmail = (email: string) =>
  email.toLowerCase().endsWith(TEACHER_DOMAIN);

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  onAuthStateChanged,
  User as FirebaseUser,
  AuthError
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { deriveRoleFromEmail, validateEmailDomainForRegistration } from '../utils/validators';
import { User } from '../types/user';
import { Role } from '../types/role';

export async function registerUser(email: string, password: string, displayName: string): Promise<{ user?: User; error?: string }> {
  // 1. Validation
  const validation = validateEmailDomainForRegistration(email);
  if (!validation.ok) return { error: validation.message };

  try {
    // 2. Create Auth User
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;

    // 3. Update Profile
    await updateProfile(firebaseUser, { displayName });

    // 4. Derive Role and Create User Document in Firestore
    const role = deriveRoleFromEmail(email) as Role;

    const newUser: User = {
      id: firebaseUser.uid,
      displayName,
      email,
      role,
      createdAt: new Date().toISOString(),
    };

    await setDoc(doc(db, 'users', firebaseUser.uid), newUser);

    return { user: newUser };

  } catch (e: any) {
    let errorMessage = 'Error al registrarse';
    if (e.code === 'auth/email-already-in-use') errorMessage = 'El correo ya está registrado';
    if (e.code === 'auth/weak-password') errorMessage = 'La contraseña es muy débil';
    console.error(e);
    return { error: errorMessage };
  }
}

/**
 * Specialized function for creating an ADMIN user.
 * Bypasses domain validation and forces ADMIN role.
 */
export async function registerAdmin(email: string, password: string, displayName: string): Promise<{ user?: User; error?: string }> {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;

    await updateProfile(firebaseUser, { displayName });

    const newUser: User = {
      id: firebaseUser.uid,
      displayName,
      email,
      role: Role.ADMIN,
      createdAt: new Date().toISOString(),
    };

    await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
    return { user: newUser };
  } catch (e: any) {
    console.error('registerAdmin error:', e);
    return { error: e.message || 'Error al crear administrador' };
  }
}

export async function loginUser(email: string, password: string): Promise<{ user?: User; error?: string }> {
  try {
    // 1. Login with Auth
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;

    // 2. Fetch User Data (Role) from Firestore
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const userData = userDoc.data() as User;
      return { user: userData };
    } else {
      // Fallback if firestore doc is missing (shouldn't happen on normal flow)
      return {
        user: {
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || 'Usuario',
          role: Role.STUDENT, // Default
          createdAt: new Date().toISOString()
        }
      };
    }

  } catch (e: any) {
    let errorMessage = 'Error al iniciar sesión';
    if (e.code === 'auth/user-not-found' || e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential') {
      errorMessage = 'Credenciales inválidas';
    }
    console.error(e);
    return { error: errorMessage };
  }
}

export async function logoutUser() {
  await auth.signOut();
}

export function subscribeToAuthChanges(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      try {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          callback(userDoc.data() as User);
        } else {
          // Fallback
          callback({
            id: firebaseUser.uid,
            displayName: firebaseUser.displayName || 'Usuario',
            email: firebaseUser.email || '',
            role: Role.STUDENT,
            createdAt: new Date().toISOString()
          });
        }
      } catch (e) {
        console.error("Error fetching user profile", e);
        callback(null);
      }
    } else {
      callback(null);
    }
  });
}

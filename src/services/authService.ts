import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  onAuthStateChanged,
  User as FirebaseUser,
  AuthError,
  GoogleAuthProvider,
  signInWithCredential,
  signInWithPopup
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { deriveRoleFromEmail, validateEmailDomainForRegistration } from '../utils/validators';
import { User } from '../types/user';
import { Role } from '../types/role';
import { Platform } from 'react-native';

export async function registerUser(email: string, password: string, displayName: string): Promise<{ user?: User; error?: string }> {
  const validation = validateEmailDomainForRegistration(email);
  if (!validation.ok) return { error: validation.message };

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;

    await updateProfile(firebaseUser, { displayName });

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
    console.error('registerUser error:', e.code || 'unknown');
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
    console.error('registerAdmin error:', e.code || 'unknown');
    return { error: 'Error al crear administrador' };
  }
}

export async function loginUser(email: string, password: string): Promise<{ user?: User; error?: string }> {
  // 1. Validar dominio institucional (excepto si es un login para algo específico, pero aquí es general)
  const validation = validateEmailDomainForRegistration(email);
  if (!validation.ok) {
    // Nota: Si permites administradores con dominios externos, deberías permitir el intento 
    // y dejar que Firebase Auth falle o que Firestore lo verifique. 
    // Pero por ahora, sigamos la regla estricta solicitada.
    return { error: 'Solo se permiten correos institucionales' };
  }

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;

    const userDocRef = doc(db, 'users', firebaseUser.uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const userData = userDoc.data() as User;
      return { user: userData };
    } else {
      return {
        user: {
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || 'Usuario',
          role: Role.STUDENT,
          createdAt: new Date().toISOString()
        }
      };
    }

  } catch (e: any) {
    let errorMessage = 'Error al iniciar sesión';
    if (e.code === 'auth/user-not-found' || e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential') {
      errorMessage = 'Credenciales inválidas';
    }
    console.error('loginUser error:', e.code || 'unknown');
    return { error: errorMessage };
  }
}

/**
 * Specialized login for ADMINS.
 * Bypasses institutional domain validation.
 */
export async function loginAdmin(email: string, password: string): Promise<{ user?: User; error?: string }> {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;

    const userDocRef = doc(db, 'users', firebaseUser.uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const userData = userDoc.data() as User;
      
      // Solo permitir acceso si el usuario tiene rol ADMIN
      if (userData.role !== Role.ADMIN) {
        await auth.signOut();
        return { error: 'Esta cuenta no tiene permisos de administrador.' };
      }
      return { user: userData };
    } else {
      await auth.signOut();
      return { error: 'Perfil de usuario no encontrado en la base de datos.' };
    }

  } catch (e: any) {
    let errorMessage = 'Error al iniciar sesión';
    if (e.code === 'auth/user-not-found' || e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential') {
      errorMessage = 'Credenciales inválidas';
    }
    console.error('loginAdmin error:', e.code || 'unknown');
    return { error: errorMessage };
  }
}

/**
 * Login con Google — Version Web (signInWithPopup).
 * Solo se usa cuando Platform.OS === 'web'.
 */
export async function loginWithGoogleWeb(): Promise<{ user?: User; error?: string }> {
  try {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    const result = await signInWithPopup(auth, provider);
    return await _processGoogleUser(result.user);

  } catch (e: any) {
    console.error('loginWithGoogleWeb error:', e.code || 'unknown');
    if (e.code === 'auth/popup-closed-by-user') {
      return { error: 'Inicio de sesión cancelado' };
    }
    return { error: 'Error al iniciar sesión con Google' };
  }
}

/**
 * Login con Google — Version Nativa (recibe un idToken de expo-auth-session).
 * Se llama desde el componente Login después de obtener el token.
 */
export async function loginWithGoogleNative(idToken: string): Promise<{ user?: User; error?: string }> {
  try {
    const credential = GoogleAuthProvider.credential(idToken);
    const result = await signInWithCredential(auth, credential);
    return await _processGoogleUser(result.user);

  } catch (e: any) {
    console.error('loginWithGoogleNative error:', e.code || 'unknown');
    return { error: 'Error al iniciar sesión con Google' };
  }
}

/**
 * Procesa el usuario de Google después de la autenticación.
 * Valida el dominio y crea/actualiza el perfil en Firestore.
 */
async function _processGoogleUser(firebaseUser: FirebaseUser): Promise<{ user?: User; error?: string }> {
  if (!firebaseUser.email) {
    await auth.signOut();
    return { error: 'No se pudo obtener el correo de Google' };
  }

  // 1. Validar dominio institucional
  const validation = validateEmailDomainForRegistration(firebaseUser.email);
  if (!validation.ok) {
    await auth.signOut();
    return { error: 'Solo se permiten correos de @itsur.edu.mx o @alumnos.itsur.edu.mx' };
  }

  // 2. Verificar si el usuario ya existe en Firestore
  const userDocRef = doc(db, 'users', firebaseUser.uid);
  const userSnap = await getDoc(userDocRef);

  if (userSnap.exists()) {
    const existingData = userSnap.data() as User;
    // Auto-update photoURL if missing in Firestore but present in Google
    if (!existingData.photoURL && firebaseUser.photoURL) {
      await setDoc(userDocRef, { photoURL: firebaseUser.photoURL }, { merge: true });
      return { user: { ...existingData, photoURL: firebaseUser.photoURL } };
    }
    return { user: existingData };
  }

  // 3. Si es nuevo, crear perfil en Firestore
  const role = deriveRoleFromEmail(firebaseUser.email) as Role;
  const newUser: User = {
    id: firebaseUser.uid,
    displayName: firebaseUser.displayName || 'Usuario Marketplace',
    email: firebaseUser.email,
    role,
    createdAt: new Date().toISOString(),
    photoURL: firebaseUser.photoURL || undefined
  };

  await setDoc(userDocRef, newUser);
  return { user: newUser };
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
          const userData = userDoc.data() as User;
          
          // Self-healing: Update Firestore if Auth has photo but Firestore doesn't
          if (!userData.photoURL && firebaseUser.photoURL) {
            setDoc(userDocRef, { photoURL: firebaseUser.photoURL }, { merge: true })
              .catch(() => console.error("Error auto-syncing photo"));
            callback({ ...userData, photoURL: firebaseUser.photoURL });
          } else {
            callback(userData);
          }
        } else {
          // Si no hay perfil en Firestore, es un nuevo usuario (Google o Email recién creado)
          // Debemos validar el dominio antes de dejarlo "entrar" a la app
          const email = firebaseUser.email || '';
          const validation = validateEmailDomainForRegistration(email);

          if (!validation.ok) {
            console.warn("Bloqueando acceso: Dominio no válido para nuevo usuario", email);
            await auth.signOut();
            callback(null);
            return;
          }

          callback({
            id: firebaseUser.uid,
            displayName: firebaseUser.displayName || 'Usuario',
            email: email,
            role: Role.STUDENT,
            createdAt: new Date().toISOString()
          });
        }
      } catch (e) {
        console.error("Error fetching user profile");
        callback(null);
      }
    } else {
      callback(null);
    }
  });
}

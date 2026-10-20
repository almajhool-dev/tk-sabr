import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword,
  createUserWithEmailAndPassword, updateProfile, sendEmailVerification,
  sendPasswordResetEmail, onAuthStateChanged, setPersistence,
  browserLocalPersistence, browserSessionPersistence, signOut,
  type User,
} from 'firebase/auth';
import type { UserAccount } from '../types/index.ts';

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};
export const firebaseConfigured = Object.values(config).every(Boolean);
const app = firebaseConfigured ? (getApps().length ? getApp() : initializeApp(config)) : null;
export const auth = app ? getAuth(app) : null;

export function mapFirebaseUser(user: User): UserAccount {
  return {
    id: user.uid,
    name: user.displayName || user.email?.split('@')[0] || 'مستخدم',
    email: user.email || '',
    avatar: user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'User')}`,
    role: 'user', // Never grant admin role from frontend claims.
    plan: 'free',
    scansUsedToday: 0, scansLimitToday: 3,
    scansUsedThisMonth: 0, scansLimitMonth: 90,
    totalScans: 0, referralCode: '', referralCount: 0, bonusScans: 0,
    favoriteAccounts: [], createdAt: user.metadata.creationTime || new Date().toISOString(),
  };
}
function requireAuth() {
  if (!auth) throw new Error('تسجيل الدخول غير مفعّل؛ يجب إعداد Firebase في متغيرات البيئة.');
  return auth;
}
export function watchAuth(callback: (user: UserAccount|null) => void) {
  return auth ? onAuthStateChanged(auth, user => callback(user ? mapFirebaseUser(user) : null)) : () => {};
}
export async function loginWithGoogle(remember: boolean) {
  const a = requireAuth();
  await setPersistence(a, remember ? browserLocalPersistence : browserSessionPersistence);
  return mapFirebaseUser((await signInWithPopup(a, new GoogleAuthProvider())).user);
}
export async function loginWithEmail(email: string, password: string, remember: boolean) {
  const a = requireAuth();
  await setPersistence(a, remember ? browserLocalPersistence : browserSessionPersistence);
  return mapFirebaseUser((await signInWithEmailAndPassword(a, email, password)).user);
}
export async function registerWithEmail(email: string, password: string, name: string, remember: boolean) {
  const a = requireAuth();
  await setPersistence(a, remember ? browserLocalPersistence : browserSessionPersistence);
  const credential = await createUserWithEmailAndPassword(a, email, password);
  if (name.trim()) await updateProfile(credential.user, {displayName:name.trim()});
  await sendEmailVerification(credential.user);
  return mapFirebaseUser(credential.user);
}
export async function resetPassword(email: string) {
  if (!email.trim()) throw new Error('أدخل بريدك الإلكتروني أولاً.');
  await sendPasswordResetEmail(requireAuth(), email.trim());
}
export async function logout() { if (auth) await signOut(auth); }

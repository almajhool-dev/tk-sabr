import { createClient } from '@supabase/supabase-js';
import type { UserAccount } from '../types/index.ts';

// Supabase publishable key is public by design. Never place a service-role key in browser code.
const env = (import.meta as any).env || {};
const published = (globalThis as any).__TK_SABR_CONFIG__ || {};
const url: string = published.supabaseUrl || env.VITE_SUPABASE_URL || '';
const key: string = published.supabaseKey || env.VITE_SUPABASE_PUBLISHABLE_KEY || '';
export const firebaseConfigured = Boolean(url && key);
export const auth = firebaseConfigured ? createClient(url, key, {
  auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true }
}) : null;

async function mapAuthUser(user: any): Promise<UserAccount> {
  let role: 'admin' | 'user' = 'user';
  if (auth) {
    const { data } = await auth.from('tksabr_admins').select('uid').eq('uid', user.id).maybeSingle();
    if (data?.uid === user.id) role = 'admin';
  }
  return {
    id: user.id, name: String(user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'مستخدم'),
    email: String(user.email || ''), avatar: String(user.user_metadata?.avatar_url || user.user_metadata?.picture || ''),
    role, plan: 'free', scansUsedToday: 0, scansLimitToday: 3, scansUsedThisMonth: 0,
    scansLimitMonth: 90, totalScans: 0, referralCode: '', referralCount: 0,
    bonusScans: 0, favoriteAccounts: [], createdAt: user.created_at || new Date().toISOString(),
  };
}

export function watchAuth(callback: (user: UserAccount | null) => void) {
  if (!auth) { callback(null); return () => {}; }
  let active = true;
  const apply = async (user: any) => {
    const mapped = user ? await mapAuthUser(user) : null;
    if (active) callback(mapped);
  };
  void auth.auth.getUser().then(({ data }) => apply(data.user)).catch(() => apply(null));
  const { data: { subscription } } = auth.auth.onAuthStateChange((_event, session) => {
    // Avoid synchronous database queries in the auth state change callback.
    queueMicrotask(() => { void apply(session?.user || null); });
  });
  return () => { active = false; subscription.unsubscribe(); };
}
function requireAuth() { if (!auth) throw new Error('خدمة الحسابات غير جاهزة.'); return auth; }
export async function loginWithGoogle(_remember: boolean) {
  const a = requireAuth();
  const { data, error } = await a.auth.signInWithOAuth({
    provider: 'google', options: { redirectTo: location.origin + location.pathname },
  });
  if (error) throw new Error('تعذر تسجيل Google. يلزم تفعيل Google OAuth وإضافة رابط الموقع إلى قائمة إعادة التوجيه.');
  // OAuth redirects away; never fake a completed session.
  throw new Error('جاري الانتقال إلى Google...');
}
export async function loginWithEmail(email: string, password: string, _remember: boolean) {
  const { data, error } = await requireAuth().auth.signInWithPassword({ email: email.trim(), password });
  if (error || !data.user) throw new Error(error?.message || 'تعذر تسجيل الدخول بالبريد.');
  return await mapAuthUser(data.user);
}
export async function registerWithEmail(email: string, password: string, name: string, _remember: boolean) {
  if (password.length < 8) throw new Error('كلمة المرور لازم تكون 8 رموز أو أكثر.');
  const { data, error } = await requireAuth().auth.signUp({
    email: email.trim(), password,
    options: { data: { full_name: name.trim().slice(0, 80) }, emailRedirectTo: location.origin + location.pathname },
  });
  if (error || !data.user) throw new Error(error?.message || 'تعذر إنشاء الحساب.');
  if (!data.session) throw new Error('تم إنشاء الحساب. افتح بريدك واضغط رابط التفعيل، وبعدها سجّل دخول.');
  return await mapAuthUser(data.user);
}
export async function resetPassword(email: string) {
  const { error } = await requireAuth().auth.resetPasswordForEmail(email.trim(), { redirectTo: location.origin + location.pathname });
  if (error) throw new Error(error.message);
}
export async function logout() { await auth?.auth.signOut(); }
export { auth as supabase };

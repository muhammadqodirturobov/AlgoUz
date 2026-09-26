import { createClient, type User } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://iurnqrrpcajohastsrdw.supabase.co";

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "sb_publishable_Uv5g26tr7GX6M073BU8Enw_dspXoutR";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

const LOCAL_USER_KEY = "algouz_local_user";
const AUTH_EVENT_NAME = "algouz-auth-change";

/**
 * Returns current locally stored mock student user if available.
 */
export function getStoredLocalUser(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LOCAL_USER_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

/**
 * Saves a local mock student session so users never get blocked by email confirmations.
 */
export function setStoredLocalUser(email: string, id?: string): User {
  const localUser: User = {
    id: id || `student_${Math.random().toString(36).substring(2, 11)}`,
    email,
    aud: "authenticated",
    role: "authenticated",
    created_at: new Date().toISOString(),
    app_metadata: { provider: "email", providers: ["email"] },
    user_metadata: { name: email.split("@")[0], is_local_bypass: true },
  };

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(localUser));
      window.dispatchEvent(
        new CustomEvent(AUTH_EVENT_NAME, { detail: localUser })
      );
    } catch {
      // Ignore storage errors
    }
  }
  return localUser;
}

/**
 * Clears local mock student session.
 */
export function clearStoredLocalUser(): void {
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(LOCAL_USER_KEY);
      window.dispatchEvent(
        new CustomEvent(AUTH_EVENT_NAME, { detail: null })
      );
    } catch {
      // Ignore storage errors
    }
  }
}

/**
 * Unified reactive listener combining Supabase auth session and local instant student session.
 */
export function subscribeToAuth(
  callback: (user: User | null) => void
): () => void {
  let isSubscribed = true;

  // 1. Initial check: Supabase session first, then fallback to local user
  supabase.auth.getSession().then(({ data: { session } }) => {
    if (!isSubscribed) return;
    if (session?.user) {
      callback(session.user);
    } else {
      callback(getStoredLocalUser());
    }
  });

  // 2. Supabase onAuthStateChange
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    if (!isSubscribed) return;
    if (session?.user) {
      callback(session.user);
    } else {
      callback(getStoredLocalUser());
    }
  });

  // 3. Local custom event listener for instant bypass / sign-out
  const handleCustomAuth = (e: Event) => {
    if (!isSubscribed) return;
    const customEvent = e as CustomEvent<User | null>;
    if (customEvent.detail) {
      callback(customEvent.detail);
    } else {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (!isSubscribed) return;
        callback(session?.user ?? getStoredLocalUser());
      });
    }
  };

  if (typeof window !== "undefined") {
    window.addEventListener(AUTH_EVENT_NAME, handleCustomAuth);
  }

  return () => {
    isSubscribed = false;
    subscription.unsubscribe();
    if (typeof window !== "undefined") {
      window.removeEventListener(AUTH_EVENT_NAME, handleCustomAuth);
    }
  };
}

import { useCallback, useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";

export type ProfileStatus = "pending" | "approved" | "rejected";

interface AdditionalDataResult {
  hasAdditionalData: boolean;
  status: ProfileStatus | null;
}

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasAdditionalData, setHasAdditionalData] = useState<boolean | null>(null);
  const [userStatus, setUserStatus] = useState<ProfileStatus | null>(null);
  const [isLoadingAdditionalData, setIsLoadingAdditionalData] = useState(false);

  const checkAdditionalData = useCallback(
    async (userId: string): Promise<AdditionalDataResult> => {
      setIsLoadingAdditionalData(true);
      try {
        const { data, error } = await supabase
          .from("perfiles")
          .select("primer_nombre, primer_apellido, foto_url, especialidad, status")
          .eq("id", userId)
          .maybeSingle();

        if (error || !data) {
          setHasAdditionalData(false);
          setUserStatus(null);
          return { hasAdditionalData: false, status: null };
        }

        const complete =
          !!data.primer_nombre?.trim() &&
          !!data.primer_apellido?.trim() &&
          !!data.foto_url?.trim() &&
          !!data.especialidad?.trim();

        const status = (data.status as ProfileStatus | null) ?? null;
        setHasAdditionalData(complete);
        setUserStatus(status);
        return { hasAdditionalData: complete, status };
      } finally {
        setIsLoadingAdditionalData(false);
      }
    },
    [],
  );

  useEffect(() => {
    const { data: subscription } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (newSession?.user && (event === "SIGNED_IN" || event === "TOKEN_REFRESHED")) {
        // Defer Supabase call to avoid deadlock inside the listener
        setTimeout(() => {
          void checkAdditionalData(newSession.user.id);
        }, 0);
      }

      if (event === "SIGNED_OUT") {
        setHasAdditionalData(null);
        setUserStatus(null);
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      if (data.session?.user) {
        void checkAdditionalData(data.session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.subscription.unsubscribe();
  }, [checkAdditionalData]);

  const signOut = useCallback(() => supabase.auth.signOut(), []);

  const signInWithEmail = useCallback(
    (email: string, password: string) =>
      supabase.auth.signInWithPassword({ email, password }),
    [],
  );

  const signUpWithEmail = useCallback(
    (email: string, password: string) =>
      supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin + "/login" },
      }),
    [],
  );

  const signInWithGoogle = useCallback(
    () =>
      lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin + "/login",
      }),
    [],
  );

  return {
    session,
    user,
    loading,
    isAuthenticated: !!session,
    hasAdditionalData,
    userStatus,
    isLoadingAdditionalData,
    checkAdditionalData,
    signOut,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
  };
}

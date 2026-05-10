import { useState, useEffect, useCallback } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface Profile {
  id: string;
  user_id: string;
  name: string;
  balance: number;
  total_deposit: number;
  total_bet: number;
  referral_code: string;
  referred_by: string | null;
  referral_earnings: number;
  avatar_url?: string;
}

interface AuthCallbacks {
  onNewAccountCreated?: (name: string) => void;
  onLogin?: (name: string) => void;
}

let authCallbacks: AuthCallbacks = {};

export const setAuthCallbacks = (callbacks: AuthCallbacks) => {
  authCallbacks = callbacks;
};

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isNewUser, setIsNewUser] = useState(false);

  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (data && !error) {
      setProfile(data as Profile);
    }
    return data as Profile | null;
  }, []);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        // Track if this is a sign-up event
        if (event === 'SIGNED_IN') {
          // Check if user just signed up (no profile yet indicates new user)
          setIsNewUser(false);
        }

        // Defer profile fetch
        if (session?.user) {
          setTimeout(() => {
            fetchProfile(session.user.id);
          }, 0);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });
    
    if (!error && data.user) {
      setIsNewUser(true);
    }
    
    return { data, error };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (!error && data.user) {
      // Trigger login callback for existing users
      setTimeout(() => {
        if (authCallbacks.onLogin) {
          fetchProfile(data.user.id).then((profile) => {
            if (profile) {
              authCallbacks.onLogin?.(profile.name);
            }
          });
        }
      }, 100);
    }
    
    return { data, error };
  };

  const signInWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });
    return { data, error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      setUser(null);
      setSession(null);
      setProfile(null);
      setIsNewUser(false);
    }
    return { error };
  };

  const createProfile = async (name: string, referralCode?: string) => {
    // Wait for user to be available (auth state might still be updating)
    let currentUser = user;
    if (!currentUser) {
      // Try to get user directly from Supabase
      const { data: { user: authUser } } = await supabase.auth.getUser();
      currentUser = authUser;
    }
    
    if (!currentUser) {
      console.error("createProfile: No user available after auth check");
      return { error: new Error("No user"), isNew: false };
    }

    let referredBy = null;
    
    // Find referrer if referral code provided
    if (referralCode) {
      const { data: referrer } = await supabase
        .from("profiles")
        .select("id")
        .eq("referral_code", referralCode.toUpperCase())
        .single();
      
      if (referrer) {
        referredBy = referrer.id;
      }
    }

    // Check if profile already exists
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", currentUser.id)
      .single();
    
    if (existingProfile) {
      setProfile(existingProfile as Profile);
      return { data: existingProfile, error: null, isNew: false };
    }

    const { data, error } = await supabase
      .from("profiles")
      .insert({
        user_id: currentUser.id,
        name,
        referred_by: referredBy,
      })
      .select()
      .single();

    if (data && !error) {
      setProfile(data as Profile);

      // Create referral record if referred
      if (referredBy) {
        await supabase.from("referrals").insert({
          referrer_id: referredBy,
          referred_id: data.id,
        });
      }
      
      // Trigger new account callback
      if (authCallbacks.onNewAccountCreated) {
        authCallbacks.onNewAccountCreated(name);
      }
    }

    return { data, error, isNew: true };
  };

  const updateBalance = async (newBalance?: number, totalBet?: number, totalDeposit?: number) => {
    if (!user || !profile) return { error: new Error("No user") };

    const prevProfile = profile;
    const updates: Partial<Profile> = {};
    
    if (newBalance !== undefined) updates.balance = newBalance;
    if (totalBet !== undefined) updates.total_bet = totalBet;
    if (totalDeposit !== undefined) updates.total_deposit = totalDeposit;

    // Skip if no updates
    if (Object.keys(updates).length === 0) return { error: null };

    // Optimistic UI update (instant wallet updates)
    setProfile((prev) => (prev ? { ...prev, ...updates } : prev));

    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("user_id", user.id);

    if (error) {
      // rollback
      setProfile(prevProfile);
    }

    return { error };
  };

  const updateProfile = async (updates: { name?: string; avatar_url?: string }) => {
    if (!user || !profile) return { error: new Error("No user") };

    const prevProfile = profile;
    
    // Optimistic UI update
    setProfile((prev) => (prev ? { ...prev, ...updates } : prev));

    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("user_id", user.id);

    if (error) {
      // rollback
      setProfile(prevProfile);
    }

    return { error };
  };

  const refreshProfile = useCallback(() => {
    if (user) {
      return fetchProfile(user.id);
    }
    return Promise.resolve(null);
  }, [user, fetchProfile]);

  return {
    user,
    session,
    profile,
    loading,
    isNewUser,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    createProfile,
    updateBalance,
    updateProfile,
    refreshProfile,
  };
};

export default useAuth;

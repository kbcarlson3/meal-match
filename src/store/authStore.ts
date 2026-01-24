import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

interface CoupleInfo {
  id: string;
  user1_id: string;
  user2_id: string | null;
  invite_code: string;
  created_at: string;
  updated_at: string;
}

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  dietary_preferences: string[];
  created_at: string;
  updated_at: string;
}

interface AuthState {
  // State
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  couple: CoupleInfo | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isPaired: boolean;

  // Actions
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  setCouple: (couple: CoupleInfo | null) => void;

  // Auth methods
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;

  // Pairing methods
  generateInviteCode: () => Promise<string>;
  acceptInviteCode: (code: string) => Promise<void>;

  // Initialization
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  // Initial state
  user: null,
  session: null,
  profile: null,
  couple: null,
  isLoading: true,
  isAuthenticated: false,
  isPaired: false,

  // Setters
  setUser: (user) => set({
    user,
    isAuthenticated: !!user
  }),

  setSession: (session) => set({ session }),

  setProfile: (profile) => set({ profile }),

  setCouple: (couple) => set({
    couple,
    isPaired: !!couple
  }),

  // Login method
  login: async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        set({
          user: data.user,
          session: data.session,
          isAuthenticated: true
        });

        // Fetch user profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (profileError) throw profileError;
        set({ profile: profileData });

        // Check if user is paired
        const { data: coupleData, error: coupleError } = await supabase
          .from('couples')
          .select('*')
          .or(`user1_id.eq.${data.user.id},user2_id.eq.${data.user.id}`)
          .single();

        if (!coupleError && coupleData) {
          set({ couple: coupleData, isPaired: true });
        }
      }
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.message || 'Failed to login');
    }
  },

  // Signup method
  signup: async (email: string, password: string, name: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        set({
          user: data.user,
          session: data.session,
          isAuthenticated: true
        });

        // Create user profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: data.user.id,
              email,
              full_name: name,
              dietary_preferences: [],
            },
          ])
          .select()
          .single();

        if (profileError) throw profileError;
        set({ profile: profileData });
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      throw new Error(error.message || 'Failed to sign up');
    }
  },

  // Logout method
  logout: async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      set({
        user: null,
        session: null,
        profile: null,
        couple: null,
        isAuthenticated: false,
        isPaired: false,
      });
    } catch (error: any) {
      console.error('Logout error:', error);
      throw new Error(error.message || 'Failed to logout');
    }
  },

  // Generate invite code for pairing
  generateInviteCode: async () => {
    try {
      const { user } = get();
      if (!user) throw new Error('User not authenticated');

      // Generate invite code using database function
      const { data: inviteCode, error: codeError } = await supabase.rpc(
        'generate_invite_code'
      );

      if (codeError || !inviteCode) {
        throw new Error('Failed to generate invite code');
      }

      // Create a couple entry with this user as user1
      const { data, error } = await supabase
        .from('couples')
        .insert([
          {
            user1_id: user.id,
            invite_code: inviteCode,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      set({ couple: data, isPaired: false }); // Not yet paired until user2 joins
      return inviteCode;
    } catch (error: any) {
      console.error('Generate invite code error:', error);
      throw new Error(error.message || 'Failed to generate invite code');
    }
  },

  // Accept invite code for pairing
  acceptInviteCode: async (code: string) => {
    try {
      const { user } = get();
      if (!user) throw new Error('User not authenticated');

      // Find the couple with this invite code
      const { data: coupleData, error: findError } = await supabase
        .from('couples')
        .select('*')
        .eq('invite_code', code.toUpperCase())
        .is('user2_id', null)
        .single();

      if (findError || !coupleData) {
        throw new Error('Invalid or expired invite code');
      }

      // Check if user is trying to pair with themselves
      if (coupleData.user1_id === user.id) {
        throw new Error('You cannot pair with yourself');
      }

      // Update the couple entry with this user as user2
      const { data: updatedCouple, error: updateError } = await supabase
        .from('couples')
        .update({
          user2_id: user.id,
        })
        .eq('id', coupleData.id)
        .select()
        .single();

      if (updateError) throw updateError;

      set({
        couple: updatedCouple,
        isPaired: true
      });
    } catch (error: any) {
      console.error('Accept invite code error:', error);
      throw new Error(error.message || 'Failed to accept invite code');
    }
  },

  // Initialize auth state
  initialize: async () => {
    try {
      set({ isLoading: true });

      // Get current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) throw sessionError;

      if (session?.user) {
        set({
          user: session.user,
          session,
          isAuthenticated: true
        });

        // Fetch user profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (!profileError && profileData) {
          set({ profile: profileData });
        }

        // Check if user is paired
        const { data: coupleData, error: coupleError } = await supabase
          .from('couples')
          .select('*')
          .or(`user1_id.eq.${session.user.id},user2_id.eq.${session.user.id}`)
          .single();

        if (!coupleError && coupleData) {
          set({ couple: coupleData, isPaired: true });
        }
      }

      // Set up auth state listener
      supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          set({
            user: session.user,
            session,
            isAuthenticated: true
          });

          // Fetch profile on sign in
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profileData) {
            set({ profile: profileData });
          }

          // Check pairing status
          const { data: coupleData } = await supabase
            .from('couples')
            .select('*')
            .or(`user1_id.eq.${session.user.id},user2_id.eq.${session.user.id}`)
            .single();

          if (coupleData) {
            set({ couple: coupleData, isPaired: true });
          }
        } else if (event === 'SIGNED_OUT') {
          set({
            user: null,
            session: null,
            profile: null,
            couple: null,
            isAuthenticated: false,
            isPaired: false,
          });
        }
      });
    } catch (error: any) {
      console.error('Initialize auth error:', error);
    } finally {
      set({ isLoading: false });
    }
  },
}));

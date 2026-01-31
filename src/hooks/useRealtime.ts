import { useEffect, useState, useCallback } from 'react';
import { supabase, Match } from '../lib/supabase';
import { RealtimeChannel, REALTIME_LISTEN_TYPES } from '@supabase/supabase-js';

export interface RealtimeConnectionState {
  connected: boolean;
  error: Error | null;
}

interface UseRealtimeOptions {
  coupleId: string | null;
  onNewMatch?: (match: Match) => void;
  enabled?: boolean;
}

interface UseRealtimeResult {
  connectionState: RealtimeConnectionState;
  subscribe: () => void;
  unsubscribe: () => void;
}

/**
 * Hook to manage real-time subscriptions for matches
 * Listens to the matches table and triggers callbacks when new matches are detected
 */
export function useRealtime({
  coupleId,
  onNewMatch,
  enabled = true,
}: UseRealtimeOptions): UseRealtimeResult {
  const [connectionState, setConnectionState] = useState<RealtimeConnectionState>({
    connected: false,
    error: null,
  });
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  /**
   * Subscribe to real-time updates
   */
  const subscribe = useCallback(() => {
    if (!coupleId || !enabled) {
      return;
    }

    // Clean up existing channel
    if (channel) {
      channel.unsubscribe();
    }

    console.log('[Realtime] Subscribing to matches for couple:', coupleId);

    // Create new channel
    const newChannel = supabase
      .channel(`matches:couple_id=eq.${coupleId}`)
      .on(
        REALTIME_LISTEN_TYPES.POSTGRES_CHANGES,
        {
          event: 'INSERT',
          schema: 'public',
          table: 'matches',
          filter: `couple_id=eq.${coupleId}`,
        },
        async (payload) => {
          console.log('[Realtime] New match detected:', payload);

          // Fetch the full match data with recipe details
          const { data: match, error } = await supabase
            .from('matches')
            .select(
              `
              *,
              recipe:recipes(*)
            `
            )
            .eq('id', payload.new.id)
            .single();

          if (error) {
            console.error('[Realtime] Error fetching match details:', error);
            return;
          }

          if (match && onNewMatch) {
            onNewMatch(match as Match);
          }
        }
      )
      .subscribe((status) => {
        console.log('[Realtime] Channel status:', status);

        if (status === 'SUBSCRIBED') {
          setConnectionState({ connected: true, error: null });
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          setConnectionState({
            connected: false,
            error: new Error(`Connection ${status}`),
          });
        }
      });

    setChannel(newChannel);
  }, [coupleId, enabled, onNewMatch]);

  /**
   * Unsubscribe from real-time updates
   */
  const unsubscribe = useCallback(() => {
    if (channel) {
      console.log('[Realtime] Unsubscribing from matches');
      channel.unsubscribe();
      setChannel(null);
      setConnectionState({ connected: false, error: null });
    }
  }, [channel]);

  // Auto-subscribe on mount and when dependencies change
  useEffect(() => {
    if (enabled && coupleId) {
      subscribe();
    }

    // Cleanup on unmount
    return () => {
      unsubscribe();
    };
  }, [coupleId, enabled]);

  return {
    connectionState,
    subscribe,
    unsubscribe,
  };
}

export default useRealtime;

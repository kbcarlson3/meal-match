import { useState, useCallback } from 'react';
import { supabase, Swipe, Match } from '../lib/supabase';
import { errorLogger } from '../utils/errorLogger';

export interface SwipeResult {
  swipe: Swipe | null;
  isMatch: boolean;
  match: Match | null;
  error: Error | null;
}

interface UseSwipesOptions {
  coupleId: string;
  userId: string;
  partnerId: string | null;
}

interface UseSwipesResult {
  recording: boolean;
  recordSwipe: (
    recipeId: string,
    direction: 'like' | 'dislike'
  ) => Promise<SwipeResult>;
}

/**
 * Hook to manage recipe swipes and match detection
 */
export function useSwipes({
  coupleId,
  userId,
  partnerId,
}: UseSwipesOptions): UseSwipesResult {
  const [recording, setRecording] = useState(false);

  /**
   * Record a swipe and check if it creates a match
   */
  const recordSwipe = useCallback(
    async (
      recipeId: string,
      direction: 'like' | 'dislike'
    ): Promise<SwipeResult> => {
      setRecording(true);

      try {
        // Record the swipe
        const { data: swipe, error: swipeError } = await supabase
          .from('swipes')
          .insert({
            user_id: userId,
            recipe_id: recipeId,
            couple_id: coupleId,
            direction,
          })
          .select()
          .single();

        if (swipeError) {
          errorLogger.error(swipeError as Error, {
            component: 'useSwipes',
            action: 'recordSwipe',
          });
          return {
            swipe: null,
            isMatch: false,
            match: null,
            error: swipeError as Error,
          };
        }

        // If this was a dislike, no need to check for match
        if (direction === 'dislike') {
          return {
            swipe: swipe as Swipe,
            isMatch: false,
            match: null,
            error: null,
          };
        }

        // Check if partner has also liked this recipe
        if (!partnerId) {
          // No partner yet, can't have a match
          return {
            swipe: swipe as Swipe,
            isMatch: false,
            match: null,
            error: null,
          };
        }

        const { data: partnerSwipe, error: partnerSwipeError } = await supabase
          .from('swipes')
          .select('*')
          .eq('user_id', partnerId)
          .eq('recipe_id', recipeId)
          .eq('couple_id', coupleId)
          .eq('direction', 'like')
          .maybeSingle();

        if (partnerSwipeError) {
          console.error('Error checking partner swipe:', partnerSwipeError);
          errorLogger.error(partnerSwipeError as Error, {
            component: 'useSwipes',
            action: 'checkPartnerSwipe',
          });
          // Don't fail the swipe if we can't check for match
          return {
            swipe: swipe as Swipe,
            isMatch: false,
            match: null,
            error: null,
          };
        }

        // If partner also liked it, create a match!
        if (partnerSwipe) {
          // Check if match already exists (shouldn't happen, but just in case)
          const { data: existingMatch } = await supabase
            .from('matches')
            .select('*')
            .eq('couple_id', coupleId)
            .eq('recipe_id', recipeId)
            .maybeSingle();

          if (existingMatch) {
            return {
              swipe: swipe as Swipe,
              isMatch: true,
              match: existingMatch as Match,
              error: null,
            };
          }

          // Create new match
          const { data: match, error: matchError } = await supabase
            .from('matches')
            .insert({
              couple_id: coupleId,
              recipe_id: recipeId,
              is_favorite: false,
            })
            .select()
            .single();

          if (matchError) {
            console.error('Error creating match:', matchError);
            errorLogger.error(matchError as Error, {
              component: 'useSwipes',
              action: 'createMatch',
            });
            return {
              swipe: swipe as Swipe,
              isMatch: false,
              match: null,
              error: null,
            };
          }

          return {
            swipe: swipe as Swipe,
            isMatch: true,
            match: match as Match,
            error: null,
          };
        }

        // No match (partner hasn't swiped yet or swiped dislike)
        return {
          swipe: swipe as Swipe,
          isMatch: false,
          match: null,
          error: null,
        };
      } catch (err) {
        console.error('Error recording swipe:', err);
        errorLogger.error(err as Error, {
          component: 'useSwipes',
          action: 'recordSwipe',
        });
        return {
          swipe: null,
          isMatch: false,
          match: null,
          error: err as Error,
        };
      } finally {
        setRecording(false);
      }
    },
    [userId, coupleId, partnerId]
  );

  return {
    recording,
    recordSwipe,
  };
}

export default useSwipes;

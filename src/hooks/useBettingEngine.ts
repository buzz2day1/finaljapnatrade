import { useState, useCallback, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

interface BetData {
  id: string;
  direction: "up" | "down";
  amount: number;
  entryPrice: number;
  returnRate: number;
  candleKey: string;
  candleEndTime: number;
}

interface CandleAggregates {
  totalUpBets: number;
  totalDownBets: number;
  betCount: number;
  isSettled: boolean;
  resultDirection?: "up" | "down";
}

interface BetResult {
  status: "won" | "lost";
  direction: "up" | "down";
  resultDirection: "up" | "down";
  amount: number;
  pnl: number;
  exitPrice: number;
}

// Type definitions for RPC responses
interface PlaceBetResponse {
  success: boolean;
  error?: string;
  bet_id?: string;
  candle_key?: string;
  amount?: number;
  direction?: string;
  new_balance?: number;
}

interface GetAggregatesResponse {
  total_up_bets: number;
  total_down_bets: number;
  bet_count: number;
  is_settled: boolean;
  result_direction?: string;
}

interface SettleCandleResponse {
  success: boolean;
  error?: string;
  already_settled?: boolean;
  candle_key?: string;
  result_direction?: string;
  winners_count?: number;
  losers_count?: number;
  total_payout?: number;
  was_random?: boolean;
}

interface GetBetResultResponse {
  success: boolean;
  error?: string;
  status?: string;
  direction?: string;
  result_direction?: string;
  amount?: number;
  pnl?: number;
  exit_price?: number;
}

interface GetPendingBetResponse {
  success: boolean;
  error?: string;
  has_bet: boolean;
  bet?: {
    id: string;
    direction: string;
    amount: number;
    entry_price: number;
    return_rate: number;
  };
}

export const useBettingEngine = (userId?: string) => {
  const [activeBet, setActiveBet] = useState<BetData | null>(null);
  const [aggregates, setAggregates] = useState<CandleAggregates>({
    totalUpBets: 0,
    totalDownBets: 0,
    betCount: 0,
    isSettled: false,
  });
  const [isPlacingBet, setIsPlacingBet] = useState(false);
  const [isSettling, setIsSettling] = useState(false);
  const aggregatesChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Generate candle key
  const generateCandleKey = useCallback((coinSymbol: string, timeframe: number, candleEndTime: number) => {
    return `${coinSymbol}_${timeframe}_${candleEndTime}`;
  }, []);

  // Calculate candle end time
  const calculateCandleEndTime = useCallback((timeframe: number) => {
    const now = Date.now();
    return Math.ceil(now / (timeframe * 1000)) * timeframe * 1000;
  }, []);

  // Subscribe to real-time aggregate updates
  const subscribeToAggregates = useCallback((candleKey: string) => {
    // Cleanup previous subscription
    if (aggregatesChannelRef.current) {
      supabase.removeChannel(aggregatesChannelRef.current);
    }

    const channel = supabase
      .channel(`aggregates_${candleKey}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'candle_bet_aggregates',
          filter: `candle_key=eq.${candleKey}`,
        },
        (payload) => {
          if (payload.new && typeof payload.new === 'object') {
            const data = payload.new as Record<string, unknown>;
            setAggregates({
              totalUpBets: Number(data.total_up_bets) || 0,
              totalDownBets: Number(data.total_down_bets) || 0,
              betCount: Number(data.bet_count) || 0,
              isSettled: Boolean(data.is_settled),
              resultDirection: data.result_direction as "up" | "down" | undefined,
            });
          }
        }
      )
      .subscribe();

    aggregatesChannelRef.current = channel;
  }, []);

  // Fetch current aggregates
  const fetchAggregates = useCallback(async (candleKey: string) => {
    const { data, error } = await supabase.rpc('get_candle_aggregates', {
      p_candle_key: candleKey,
    });

    if (data && !error) {
      const typedData = data as unknown as GetAggregatesResponse;
      setAggregates({
        totalUpBets: Number(typedData.total_up_bets) || 0,
        totalDownBets: Number(typedData.total_down_bets) || 0,
        betCount: Number(typedData.bet_count) || 0,
        isSettled: Boolean(typedData.is_settled),
        resultDirection: typedData.result_direction as "up" | "down" | undefined,
      });
    }

    return data;
  }, []);

  // Place bet via RPC
  const placeBet = useCallback(async (
    coinSymbol: string,
    timeframe: number,
    direction: "up" | "down",
    amount: number,
    entryPrice: number,
    returnRate: number = 100
  ): Promise<{ success: boolean; error?: string; newBalance?: number }> => {
    if (!userId) {
      return { success: false, error: "Not authenticated" };
    }

    if (activeBet) {
      return { success: false, error: "Already have active bet" };
    }

    setIsPlacingBet(true);

    try {
      const candleEndTime = calculateCandleEndTime(timeframe);
      const candleKey = generateCandleKey(coinSymbol, timeframe, candleEndTime);

      const { data, error } = await supabase.rpc('place_bet', {
        p_coin_symbol: coinSymbol,
        p_timeframe: timeframe,
        p_candle_end_time: candleEndTime,
        p_direction: direction,
        p_amount: amount,
        p_entry_price: entryPrice,
        p_return_rate: returnRate,
      });

      if (error) {
        console.error("Place bet error:", error);
        return { success: false, error: error.message };
      }

      const typedData = data as unknown as PlaceBetResponse;

      if (!typedData?.success) {
        return { success: false, error: typedData?.error || "Failed to place bet" };
      }

      // Set active bet
      setActiveBet({
        id: typedData.bet_id!,
        direction,
        amount,
        entryPrice,
        returnRate,
        candleKey,
        candleEndTime,
      });

      // Subscribe to real-time updates
      subscribeToAggregates(candleKey);
      
      // Fetch initial aggregates
      await fetchAggregates(candleKey);

      return { 
        success: true, 
        newBalance: Number(typedData.new_balance) 
      };
    } catch (err) {
      console.error("Place bet exception:", err);
      return { success: false, error: "Network error" };
    } finally {
      setIsPlacingBet(false);
    }
  }, [userId, activeBet, calculateCandleEndTime, generateCandleKey, subscribeToAggregates, fetchAggregates]);

  // Settle candle via RPC (called when timer hits 0)
  const settleCandle = useCallback(async (
    exitPrice: number
  ): Promise<{ success: boolean; result?: BetResult; error?: string }> => {
    if (!activeBet) {
      return { success: false, error: "No active bet" };
    }

    setIsSettling(true);

    try {
      const { data, error } = await supabase.rpc('settle_candle', {
        p_candle_key: activeBet.candleKey,
        p_exit_price: exitPrice,
      });

      if (error) {
        console.error("Settle error:", error);
        return { success: false, error: error.message };
      }

      const typedData = data as unknown as SettleCandleResponse;

      if (!typedData?.success) {
        return { success: false, error: typedData?.error || "Failed to settle" };
      }

      // Get the bet result
      const { data: betResultData } = await supabase.rpc('get_bet_result', {
        p_bet_id: activeBet.id,
      });

      const betResult = betResultData as unknown as GetBetResultResponse;

      // Clear active bet
      const clearedBet = activeBet;
      setActiveBet(null);

      // Cleanup subscription
      if (aggregatesChannelRef.current) {
        supabase.removeChannel(aggregatesChannelRef.current);
        aggregatesChannelRef.current = null;
      }

      // Reset aggregates
      setAggregates({
        totalUpBets: 0,
        totalDownBets: 0,
        betCount: 0,
        isSettled: false,
      });

      if (betResult?.success) {
        return {
          success: true,
          result: {
            status: betResult.status as "won" | "lost",
            direction: clearedBet.direction,
            resultDirection: typedData.result_direction as "up" | "down",
            amount: clearedBet.amount,
            pnl: Number(betResult.pnl),
            exitPrice: Number(betResult.exit_price),
          },
        };
      }

      return { success: true };
    } catch (err) {
      console.error("Settle exception:", err);
      return { success: false, error: "Network error" };
    } finally {
      setIsSettling(false);
    }
  }, [activeBet]);

  // Check for existing pending bet on page load
  const checkExistingBet = useCallback(async (coinSymbol: string, timeframe: number) => {
    if (!userId) return null;

    const candleEndTime = calculateCandleEndTime(timeframe);
    const candleKey = generateCandleKey(coinSymbol, timeframe, candleEndTime);

    const { data } = await supabase.rpc('get_user_pending_bet', {
      p_candle_key: candleKey,
    });

    const typedData = data as unknown as GetPendingBetResponse;

    if (typedData?.has_bet && typedData.bet) {
      setActiveBet({
        id: typedData.bet.id,
        direction: typedData.bet.direction as "up" | "down",
        amount: Number(typedData.bet.amount),
        entryPrice: Number(typedData.bet.entry_price),
        returnRate: Number(typedData.bet.return_rate),
        candleKey,
        candleEndTime,
      });

      // Subscribe and fetch aggregates
      subscribeToAggregates(candleKey);
      await fetchAggregates(candleKey);

      return typedData.bet;
    }

    return null;
  }, [userId, calculateCandleEndTime, generateCandleKey, subscribeToAggregates, fetchAggregates]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (aggregatesChannelRef.current) {
        supabase.removeChannel(aggregatesChannelRef.current);
      }
    };
  }, []);

  return {
    activeBet,
    aggregates,
    isPlacingBet,
    isSettling,
    placeBet,
    settleCandle,
    checkExistingBet,
    fetchAggregates,
    generateCandleKey,
    calculateCandleEndTime,
  };
};

export default useBettingEngine;

import { useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Transaction {
  id: string;
  user_id: string;
  type: string;
  amount: number;
  status: string;
  coin: string | null;
  wallet_address: string | null;
  created_at: string;
  updated_at: string;
}

interface UseRealtimeTransactionsProps {
  userId?: string;
  onTransactionUpdate?: (transaction: Transaction) => void;
  onTransactionInsert?: (transaction: Transaction) => void;
}

export const useRealtimeTransactions = ({
  userId,
  onTransactionUpdate,
  onTransactionInsert,
}: UseRealtimeTransactionsProps) => {
  const showStatusToast = useCallback((transaction: Transaction, eventType: 'INSERT' | 'UPDATE') => {
    const typeLabel = transaction.type === 'deposit' ? 'Deposit' : 'Withdrawal';
    const statusIcons: Record<string, string> = {
      pending: '⏳',
      processing: '🔄',
      completed: '✅',
      approved: '✅',
      failed: '❌',
      rejected: '❌',
    };

    const icon = statusIcons[transaction.status] || '📋';

    if (eventType === 'INSERT') {
      toast.info(`${icon} New ${typeLabel} Request`, {
        description: `₹${transaction.amount.toLocaleString()} ${transaction.coin || ''} - ${transaction.status}`,
        duration: 4000,
      });
    } else {
      // Status update
      const statusMessages: Record<string, string> = {
        pending: 'is pending review',
        processing: 'is being processed',
        completed: 'has been completed!',
        approved: 'has been approved!',
        failed: 'has failed',
        rejected: 'has been rejected',
      };

      const message = statusMessages[transaction.status] || `status: ${transaction.status}`;
      
      if (transaction.status === 'completed' || transaction.status === 'approved') {
        toast.success(`${icon} ${typeLabel} ${message}`, {
          description: `₹${transaction.amount.toLocaleString()} ${transaction.coin || ''}`,
          duration: 5000,
        });
      } else if (transaction.status === 'failed' || transaction.status === 'rejected') {
        toast.error(`${icon} ${typeLabel} ${message}`, {
          description: `₹${transaction.amount.toLocaleString()} ${transaction.coin || ''}`,
          duration: 5000,
        });
      } else {
        toast.info(`${icon} ${typeLabel} ${message}`, {
          description: `₹${transaction.amount.toLocaleString()} ${transaction.coin || ''}`,
          duration: 4000,
        });
      }
    }
  }, []);

  useEffect(() => {
    if (!userId) return;

    // Subscribe to real-time transaction changes
    const channel = supabase
      .channel(`transactions:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "transactions",
          filter: `user_id=eq.${userId}`,
        },
        (payload: { new: Transaction }) => {
          const newTransaction = payload.new;
          showStatusToast(newTransaction, 'INSERT');
          onTransactionInsert?.(newTransaction);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "transactions",
          filter: `user_id=eq.${userId}`,
        },
        (payload: { new: Transaction }) => {
          const updatedTransaction = payload.new;
          showStatusToast(updatedTransaction, 'UPDATE');
          onTransactionUpdate?.(updatedTransaction);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, onTransactionUpdate, onTransactionInsert, showStatusToast]);

  return null;
};

export default useRealtimeTransactions;

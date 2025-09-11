"use client"

import { useCallback } from "react"
import { useTransactionData } from "./use-transaction-data"

interface DateRange {
  start: Date
  end: Date
}

export function useTransactionManager(dateRange?: DateRange) {
  const {
    transactions,
    wallets,
    categories,
    isLoading,
    isCreating,
    isUpdating,
    error,
    createTransaction,
    updateTransactionStatus,
    refresh,
  } = useTransactionData(dateRange)

  // Legacy compatibility - keep the same interface
  const loadTransactions = useCallback(
    async (range: DateRange) => {
      // This is now handled automatically by SWR when dateRange changes
      // Just trigger a refresh to ensure we have the latest data
      await refresh()
    },
    [refresh],
  )

  return {
    transactions,
    wallets,
    categories,
    isLoading: isLoading || isCreating || isUpdating,
    error,
    loadTransactions,
    createTransaction,
    updateTransactionStatus,
    refresh,
  }
}

"use client"

import useSWR from "swr"
import { useState, useCallback, useMemo } from "react"
import {
  getTransactions,
  createTransaction,
  updateTransactionStatus,
  getWallets,
  getCategories,
  type Transaction,
  type CreateTransactionData,
  type Wallet,
  type Category,
  supabase, // Declared the supabase variable
} from "@/lib/supabase/client"

interface DateRange {
  start: Date
  end: Date
}

export function useTransactionData(dateRange?: DateRange) {
  const [isCreating, setIsCreating] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  // Generate cache key based on date range
  const cacheKey = dateRange
    ? `transactions-${dateRange.start.toISOString()}-${dateRange.end.toISOString()}`
    : "transactions-all"

  // Fetcher function for SWR
  const fetcher = useCallback(async () => {
    if (dateRange) {
      // Fetch transactions for specific date range
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .gte("transaction_date", dateRange.start.toISOString())
        .lte("transaction_date", dateRange.end.toISOString())
        .order("transaction_date", { ascending: true })

      if (error) throw error
      return data || []
    } else {
      // Fetch all transactions
      return await getTransactions()
    }
  }, [dateRange])

  // Main transactions query with SWR
  const {
    data: transactions = [],
    error,
    isLoading,
    mutate: mutateTransactions,
  } = useSWR<Transaction[]>(cacheKey, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 5000, // Prevent duplicate requests within 5 seconds
  })

  // Wallets query
  const { data: wallets = [], mutate: mutateWallets } = useSWR<Wallet[]>("wallets", getWallets, {
    revalidateOnFocus: false,
    dedupingInterval: 30000, // Wallets change less frequently
  })

  // Categories query
  const { data: categories = [], mutate: mutateCategories } = useSWR<Category[]>("categories", () => getCategories(), {
    revalidateOnFocus: false,
    dedupingInterval: 30000, // Categories change less frequently
  })

  // Create transaction with optimistic updates
  const createTransactionOptimistic = useCallback(
    async (data: CreateTransactionData) => {
      setIsCreating(true)
      try {
        const newTransaction = await createTransaction(data)

        // Optimistically update the cache
        await mutateTransactions((current = []) => {
          const updated = [...current, newTransaction].sort(
            (a, b) => new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime(),
          )
          return updated
        }, false) // Don't revalidate immediately

        return newTransaction
      } catch (error) {
        // Revalidate on error to get correct state
        await mutateTransactions()
        throw error
      } finally {
        setIsCreating(false)
      }
    },
    [mutateTransactions],
  )

  // Update transaction status with optimistic updates
  const updateStatusOptimistic = useCallback(
    async (id: string, status: string) => {
      setIsUpdating(true)
      try {
        const updatedTransaction = await updateTransactionStatus(id, status)

        // Optimistically update the cache
        await mutateTransactions((current = []) => {
          return current.map((t) => (t.id === id ? { ...t, status, updated_at: updatedTransaction.updated_at } : t))
        }, false) // Don't revalidate immediately

        return updatedTransaction
      } catch (error) {
        // Revalidate on error to get correct state
        await mutateTransactions()
        throw error
      } finally {
        setIsUpdating(false)
      }
    },
    [mutateTransactions],
  )

  // Manual refresh function
  const refresh = useCallback(async () => {
    await Promise.all([mutateTransactions(), mutateWallets(), mutateCategories()])
  }, [mutateTransactions, mutateWallets, mutateCategories])

  return {
    // Data
    transactions,
    wallets,
    categories,

    // Loading states
    isLoading,
    isCreating,
    isUpdating,
    error,

    // Actions
    createTransaction: createTransactionOptimistic,
    updateTransactionStatus: updateStatusOptimistic,
    refresh,

    // Cache control
    mutateTransactions,
    mutateWallets,
    mutateCategories,
  }
}

export function useTimelineData(focusDate: Date, zoomLevel: string) {
  const dateRange = useMemo(() => {
    const start = new Date(focusDate)
    const end = new Date(focusDate)

    switch (zoomLevel) {
      case "hour":
        // Load full day for hour view
        start.setHours(0, 0, 0, 0)
        end.setHours(23, 59, 59, 999)
        break
      case "day":
        // Load full week for day view
        const dayOfWeek = start.getDay()
        start.setDate(start.getDate() - dayOfWeek)
        start.setHours(0, 0, 0, 0)
        end.setDate(start.getDate() + 6)
        end.setHours(23, 59, 59, 999)
        break
      case "week":
        // Load full month for week view
        start.setDate(1)
        start.setHours(0, 0, 0, 0)
        end.setMonth(end.getMonth() + 1, 0)
        end.setHours(23, 59, 59, 999)
        break
      case "month":
        // Load full year for month view
        start.setMonth(0, 1)
        start.setHours(0, 0, 0, 0)
        end.setMonth(11, 31)
        end.setHours(23, 59, 59, 999)
        break
      case "year":
        // Load 5 years for year view
        start.setFullYear(start.getFullYear() - 2, 0, 1)
        start.setHours(0, 0, 0, 0)
        end.setFullYear(end.getFullYear() + 2, 11, 31)
        end.setHours(23, 59, 59, 999)
        break
      default:
        // Default to current day
        start.setHours(0, 0, 0, 0)
        end.setHours(23, 59, 59, 999)
    }

    return { start, end }
  }, [focusDate, zoomLevel])

  return useTransactionData(dateRange)
}

export function useTransactionAggregation(transactions: Transaction[], zoomLevel: string) {
  return useMemo(() => {
    if (!transactions.length) return { income: [], expenses: [], net: [] }

    const aggregated = transactions.reduce(
      (acc, transaction) => {
        const date = new Date(transaction.transaction_date)
        let key: string

        switch (zoomLevel) {
          case "hour":
            key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}`
            break
          case "day":
            key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
            break
          case "week":
            const weekStart = new Date(date)
            weekStart.setDate(date.getDate() - date.getDay())
            key = `${weekStart.getFullYear()}-${weekStart.getMonth()}-${weekStart.getDate()}`
            break
          case "month":
            key = `${date.getFullYear()}-${date.getMonth()}`
            break
          case "year":
            key = `${date.getFullYear()}`
            break
          default:
            key = date.toISOString().split("T")[0]
        }

        if (!acc[key]) {
          acc[key] = { income: 0, expenses: 0, net: 0 }
        }

        if (transaction.transaction_type === "income") {
          acc[key].income += transaction.amount
          acc[key].net += transaction.amount
        } else if (transaction.transaction_type === "expense") {
          acc[key].expenses += Math.abs(transaction.amount)
          acc[key].net -= Math.abs(transaction.amount)
        }

        return acc
      },
      {} as Record<string, { income: number; expenses: number; net: number }>,
    )

    const sortedKeys = Object.keys(aggregated).sort()

    return {
      income: sortedKeys.map((key) => ({ date: key, value: aggregated[key].income })),
      expenses: sortedKeys.map((key) => ({ date: key, value: aggregated[key].expenses })),
      net: sortedKeys.map((key) => ({ date: key, value: aggregated[key].net })),
    }
  }, [transactions, zoomLevel])
}

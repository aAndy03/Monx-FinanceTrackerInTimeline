"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import type { CursorState } from "@/components/timeline/custom-cursor"

export function useCursorState() {
  const [cursorState, setCursorState] = useState<CursorState>({ type: "default" })
  const [isInTimeline, setIsInTimeline] = useState(false)

  // Keyboard state tracking
  const [keysPressed, setKeysPressed] = useState<Set<string>>(new Set())
  const [isScrolling, setIsScrolling] = useState(false)
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastScrollDirection = useRef<"up" | "down" | null>(null)

  // Enhanced scroll detection with direction tracking
  const updateCursorForInteraction = useCallback(
    (deltaY: number) => {
      const direction = deltaY < 0 ? "up" : "down"
      lastScrollDirection.current = direction

      if (keysPressed.has("Control")) {
        setCursorState({
          type: direction === "up" ? "zooming-in" : "zooming-out",
          direction,
        })
      } else if (keysPressed.has("Alt")) {
        setCursorState({
          type: "vertical-scroll",
          direction,
        })
      } else if (keysPressed.has("Shift")) {
        setCursorState({
          type: "minute-scroll",
          direction,
        })
      } else {
        // Regular scroll - show subtle direction indicator
        setCursorState({
          type: "default",
        })
      }

      setIsScrolling(true)

      // Clear existing timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }

      // Reset to appropriate state after scrolling stops
      const timeout = setTimeout(() => {
        setIsScrolling(false)
        updateCursorForKeys()
      }, 300)

      scrollTimeoutRef.current = timeout
    },
    [keysPressed],
  )

  // Update cursor based on currently pressed keys
  const updateCursorForKeys = useCallback(() => {
    if (isScrolling) return

    if (keysPressed.has("t")) {
      setCursorState({ type: "transaction-mode" })
    } else if (keysPressed.has("Control")) {
      setCursorState({ type: "action-possible" })
    } else if (keysPressed.has("Alt")) {
      setCursorState({ type: "action-possible" })
    } else if (keysPressed.has("Shift")) {
      setCursorState({ type: "action-possible" })
    } else if (keysPressed.size === 0) {
      setCursorState({ type: "default" })
    }
  }, [keysPressed, isScrolling])

  // Enhanced keyboard event handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent handling if user is typing in an input
      const target = e.target as HTMLElement
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
        return
      }

      const newKeys = new Set(keysPressed)

      // Normalize key names
      const key = e.key.toLowerCase()

      if (e.ctrlKey || e.metaKey) newKeys.add("Control")
      if (e.altKey) newKeys.add("Alt")
      if (e.shiftKey) newKeys.add("Shift")
      if (key === "t") newKeys.add("t")

      // Add support for additional shortcuts
      if (key === "escape") {
        // ESC key resets cursor to default
        newKeys.clear()
        setCursorState({ type: "default" })
      }

      setKeysPressed(newKeys)

      // Update cursor immediately if not scrolling
      if (!isScrolling) {
        setTimeout(updateCursorForKeys, 0)
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      const newKeys = new Set(keysPressed)
      const key = e.key.toLowerCase()

      if (!e.ctrlKey && !e.metaKey) newKeys.delete("Control")
      if (!e.altKey) newKeys.delete("Alt")
      if (!e.shiftKey) newKeys.delete("Shift")
      if (key === "t") newKeys.delete("t")

      setKeysPressed(newKeys)

      // Update cursor immediately if not scrolling
      if (!isScrolling) {
        setTimeout(updateCursorForKeys, 0)
      }
    }

    const handleWheel = (e: WheelEvent) => {
      if (isInTimeline) {
        updateCursorForInteraction(e.deltaY)
      }
    }

    // Handle window focus/blur to reset keys
    const handleWindowBlur = () => {
      setKeysPressed(new Set())
      if (!isScrolling) {
        setCursorState({ type: "default" })
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)
    window.addEventListener("wheel", handleWheel, { passive: true })
    window.addEventListener("blur", handleWindowBlur)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
      window.removeEventListener("wheel", handleWheel)
      window.removeEventListener("blur", handleWindowBlur)
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
    }
  }, [keysPressed, isScrolling, isInTimeline, updateCursorForInteraction, updateCursorForKeys])

  // Public API for components to update cursor state
  const setCursor = useCallback((state: CursorState) => {
    setCursorState(state)
  }, [])

  const setHoverState = useCallback(
    (isHovering: boolean) => {
      if (!isScrolling && keysPressed.size === 0) {
        setCursorState({ type: isHovering ? "hover" : "default" })
      }
    },
    [isScrolling, keysPressed],
  )

  const setActionPossible = useCallback(
    (isPossible: boolean) => {
      if (!isScrolling && keysPressed.size === 0) {
        setCursorState({ type: isPossible ? "action-possible" : "default" })
      }
    },
    [isScrolling, keysPressed],
  )

  const setDragging = useCallback((isDragging: boolean, direction?: "up" | "down" | "left" | "right") => {
    setCursorState({
      type: isDragging ? "dragging" : "default",
      direction,
    })
  }, [])

  const setBoundaryHold = useCallback(
    (progress: number, direction?: "up" | "down") => {
      if (progress > 0) {
        setCursorState({
          type: "boundary-hold",
          progress,
          direction,
        })
      } else {
        // Return to previous state or default
        updateCursorForKeys()
      }
    },
    [updateCursorForKeys],
  )

  const setTimelineActive = useCallback(
    (active: boolean) => {
      setIsInTimeline(active)
      if (!active) {
        setCursorState({ type: "disabled" })
      } else if (keysPressed.size === 0 && !isScrolling) {
        setCursorState({ type: "default" })
      }
    },
    [keysPressed, isScrolling],
  )

  return {
    cursorState,
    isInTimeline,
    keysPressed: Array.from(keysPressed), // Expose for debugging
    setCursor,
    setHoverState,
    setActionPossible,
    setDragging,
    setBoundaryHold,
    setTimelineActive,
  }
}

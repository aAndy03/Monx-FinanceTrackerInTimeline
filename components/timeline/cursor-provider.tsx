"use client"

import { createContext, useContext, type ReactNode } from "react"
import { CustomCursor } from "./custom-cursor"
import { useCursorState } from "@/hooks/use-cursor-state"

interface CursorContextType {
  setHoverState: (isHovering: boolean) => void
  setActionPossible: (isPossible: boolean) => void
  setDragging: (isDragging: boolean) => void
  setBoundaryHold: (progress: number, direction?: "up" | "down") => void
  setTimelineActive: (active: boolean) => void
}

const CursorContext = createContext<CursorContextType | null>(null)

export function useCursor() {
  const context = useContext(CursorContext)
  if (!context) {
    throw new Error("useCursor must be used within a CursorProvider")
  }
  return context
}

interface CursorProviderProps {
  children: ReactNode
}

export function CursorProvider({ children }: CursorProviderProps) {
  const {
    cursorState,
    isInTimeline,
    setHoverState,
    setActionPossible,
    setDragging,
    setBoundaryHold,
    setTimelineActive,
  } = useCursorState()

  return (
    <CursorContext.Provider
      value={{
        setHoverState,
        setActionPossible,
        setDragging,
        setBoundaryHold,
        setTimelineActive,
      }}
    >
      {children}
      <CustomCursor state={cursorState} isInTimeline={isInTimeline} />
    </CursorContext.Provider>
  )
}

"use client"

import { type ReactNode, useRef } from "react"
import { useCursor } from "./cursor-provider"

interface InteractiveElementProps {
  children: ReactNode
  onHover?: () => void
  onLeave?: () => void
  onClick?: () => void
  actionPossible?: boolean
  className?: string
  disabled?: boolean
}

export function InteractiveElement({
  children,
  onHover,
  onLeave,
  onClick,
  actionPossible = false,
  className = "",
  disabled = false,
}: InteractiveElementProps) {
  const { setHoverState, setActionPossible } = useCursor()
  const elementRef = useRef<HTMLDivElement>(null)

  const handleMouseEnter = () => {
    if (disabled) return

    if (actionPossible) {
      setActionPossible(true)
    } else {
      setHoverState(true)
    }

    onHover?.()
  }

  const handleMouseLeave = () => {
    if (disabled) return

    setHoverState(false)
    setActionPossible(false)
    onLeave?.()
  }

  const handleClick = () => {
    if (disabled) return
    onClick?.()
  }

  return (
    <div
      ref={elementRef}
      className={`${className} ${disabled ? "pointer-events-none opacity-50" : "cursor-none"}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      {children}
    </div>
  )
}

"use client"

import { useEffect, useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"

export interface CursorState {
  type:
    | "default" // Empty timeline space
    | "hover" // Over interactive elements
    | "action-possible" // Action can be performed (grows)
    | "dragging" // Drag and hold
    | "zooming-in" // Ctrl + scroll up
    | "zooming-out" // Ctrl + scroll down
    | "vertical-scroll" // Alt + scroll
    | "minute-scroll" // Shift + scroll
    | "boundary-hold" // Drag and hold at edge
    | "transaction-mode" // T key pressed
    | "disabled" // Outside timeline
  progress?: number // For boundary breaking (0-1)
  direction?: "up" | "down" | "left" | "right"
}

interface CustomCursorProps {
  state: CursorState
  isInTimeline: boolean
}

export function CustomCursor({ state, isInTimeline }: CustomCursorProps) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isVisible, setIsVisible] = useState(false)
  const cursorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const updateMousePosition = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
      setIsVisible(true)
    }

    const handleMouseLeave = () => setIsVisible(false)
    const handleMouseEnter = () => setIsVisible(true)

    document.addEventListener("mousemove", updateMousePosition)
    document.addEventListener("mouseleave", handleMouseLeave)
    document.addEventListener("mouseenter", handleMouseEnter)

    return () => {
      document.removeEventListener("mousemove", updateMousePosition)
      document.removeEventListener("mouseleave", handleMouseLeave)
      document.removeEventListener("mouseenter", handleMouseEnter)
    }
  }, [])

  // Hide default cursor when our custom cursor is active
  useEffect(() => {
    if (isInTimeline && isVisible) {
      document.body.style.cursor = "none"
    } else {
      document.body.style.cursor = "auto"
    }

    return () => {
      document.body.style.cursor = "auto"
    }
  }, [isInTimeline, isVisible])

  const getCursorVariant = () => {
    switch (state.type) {
      case "default":
        return {
          scale: 1,
          opacity: 0.7,
          backgroundColor: "rgba(0, 0, 0, 0.7)",
          backdropFilter: "blur(2px)",
          border: "none",
          width: 20,
          height: 20,
        }

      case "hover":
        return {
          scale: 1.1,
          opacity: 0.8,
          backgroundColor: "rgba(0, 0, 0, 0.6)",
          backdropFilter: "blur(3px)",
          border: "2px solid rgba(139, 92, 246, 0.8)",
          width: 24,
          height: 24,
        }

      case "action-possible":
        return {
          scale: 1.3,
          opacity: 0.9,
          backgroundColor: "rgba(139, 92, 246, 0.2)",
          backdropFilter: "blur(4px)",
          border: "2px solid rgba(139, 92, 246, 1)",
          width: 28,
          height: 28,
        }

      case "dragging":
        return {
          scale: 1.2,
          opacity: 0.8,
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          backdropFilter: "blur(3px)",
          border: "2px solid rgba(31, 41, 55, 0.8)",
          width: 32,
          height: 20, // Elongated for dragging
        }

      case "zooming-in":
        return {
          scale: 1.4,
          opacity: 0.9,
          backgroundColor: "rgba(34, 197, 94, 0.3)",
          backdropFilter: "blur(4px)",
          border: "2px solid rgba(34, 197, 94, 1)",
          width: 32,
          height: 32,
        }

      case "zooming-out":
        return {
          scale: 0.8,
          opacity: 0.6,
          backgroundColor: "rgba(239, 68, 68, 0.3)",
          backdropFilter: "blur(2px)",
          border: "2px solid rgba(239, 68, 68, 1)",
          width: 16,
          height: 16,
        }

      case "vertical-scroll":
        return {
          scale: 1.1,
          opacity: 0.8,
          backgroundColor: "rgba(59, 130, 246, 0.3)",
          backdropFilter: "blur(3px)",
          border: "2px solid rgba(59, 130, 246, 1)",
          width: 20,
          height: 32, // Taller for vertical movement
        }

      case "minute-scroll":
        return {
          scale: 1.1,
          opacity: 0.8,
          backgroundColor: "rgba(245, 158, 11, 0.3)",
          backdropFilter: "blur(3px)",
          border: "2px solid rgba(245, 158, 11, 1)",
          width: 32,
          height: 20, // Wider for horizontal movement
        }

      case "boundary-hold":
        const progress = state.progress || 0
        return {
          scale: 1 + progress * 0.5,
          opacity: 0.7 + progress * 0.3,
          backgroundColor: `rgba(220, 38, 38, ${0.2 + progress * 0.3})`,
          backdropFilter: "blur(4px)",
          border: `3px solid rgba(220, 38, 38, ${0.5 + progress * 0.5})`,
          width: 24 + progress * 12,
          height: 24 + progress * 12,
        }

      case "transaction-mode":
        return {
          scale: 1.2,
          opacity: 0.9,
          backgroundColor: "rgba(16, 185, 129, 0.3)",
          backdropFilter: "blur(4px)",
          border: "2px solid rgba(16, 185, 129, 1)",
          width: 28,
          height: 28,
        }

      case "disabled":
        return {
          scale: 0.6,
          opacity: 0.3,
          backgroundColor: "rgba(107, 114, 128, 0.3)",
          backdropFilter: "blur(1px)",
          border: "1px solid rgba(107, 114, 128, 0.5)",
          width: 16,
          height: 16,
        }

      default:
        return {
          scale: 1,
          opacity: 0.7,
          backgroundColor: "rgba(0, 0, 0, 0.7)",
          backdropFilter: "blur(2px)",
          border: "none",
          width: 20,
          height: 20,
        }
    }
  }

  const cursorVariant = getCursorVariant()

  const renderCursorContent = () => {
    switch (state.type) {
      case "transaction-mode":
        return (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-3 h-0.5 bg-white rounded-full" />
            <div className="absolute w-0.5 h-3 bg-white rounded-full" />
          </div>
        )

      case "zooming-in":
        return (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-0.5 bg-white rounded-full" />
            <div className="absolute w-0.5 h-2 bg-white rounded-full" />
          </div>
        )

      case "zooming-out":
        return (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-0.5 bg-white rounded-full" />
          </div>
        )

      case "vertical-scroll":
        return (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-0.5">
              <div className="w-0 h-0 border-l-[3px] border-r-[3px] border-b-[4px] border-l-transparent border-r-transparent border-b-white" />
              <div className="w-0 h-0 border-l-[3px] border-r-[3px] border-t-[4px] border-l-transparent border-r-transparent border-t-white" />
            </div>
          </div>
        )

      case "minute-scroll":
        return (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex items-center gap-0.5">
              <div className="w-0 h-0 border-t-[3px] border-b-[3px] border-r-[4px] border-t-transparent border-b-transparent border-r-white" />
              <div className="w-0 h-0 border-t-[3px] border-b-[3px] border-l-[4px] border-t-transparent border-b-transparent border-l-white" />
            </div>
          </div>
        )

      case "boundary-hold":
        const progress = state.progress || 0
        return (
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="rounded-full bg-white"
              style={{
                width: `${4 + progress * 8}px`,
                height: `${4 + progress * 8}px`,
                opacity: 0.8 + progress * 0.2,
              }}
            />
          </div>
        )

      default:
        return null
    }
  }

  if (!isInTimeline || !isVisible) {
    return null
  }

  return (
    <AnimatePresence>
      <motion.div
        ref={cursorRef}
        className="fixed pointer-events-none z-[9999] rounded-full"
        style={{
          left: mousePosition.x - cursorVariant.width / 2,
          top: mousePosition.y - cursorVariant.height / 2,
          width: cursorVariant.width,
          height: cursorVariant.height,
          backgroundColor: cursorVariant.backgroundColor,
          backdropFilter: cursorVariant.backdropFilter,
          border: cursorVariant.border,
        }}
        animate={{
          scale: cursorVariant.scale,
          opacity: cursorVariant.opacity,
        }}
        transition={{
          type: "spring",
          stiffness: 400,
          damping: 25,
          mass: 0.5,
        }}
      >
        {renderCursorContent()}

        {/* Progress ring for boundary breaking */}
        {state.type === "boundary-hold" && state.progress && (
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-red-500"
            style={{
              background: `conic-gradient(from 0deg, rgba(220, 38, 38, 0.8) ${state.progress * 360}deg, transparent ${state.progress * 360}deg)`,
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 2, ease: "linear", repeat: Number.POSITIVE_INFINITY }}
          />
        )}
      </motion.div>
    </AnimatePresence>
  )
}

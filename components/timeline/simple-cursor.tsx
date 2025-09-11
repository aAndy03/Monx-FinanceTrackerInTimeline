"use client"

import { useEffect, useRef, useCallback } from "react"

export function SimpleCursor() {
  const cursorRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number>()
  const positionRef = useRef({ x: 0, y: 0 })
  const targetPositionRef = useRef({ x: 0, y: 0 })
  const stateRef = useRef({ isHover: false, isAction: false })

  const lerp = (start: number, end: number, factor: number) => {
    return start + (end - start) * factor
  }

  const updateCursor = useCallback(() => {
    if (!cursorRef.current) return

    const cursor = cursorRef.current
    const current = positionRef.current
    const target = targetPositionRef.current

    current.x = lerp(current.x, target.x, 0.15)
    current.y = lerp(current.y, target.y, 0.15)

    cursor.style.transform = `translate3d(${current.x - 10}px, ${current.y - 10}px, 0)`

    animationRef.current = requestAnimationFrame(updateCursor)
  }, [])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    targetPositionRef.current = { x: e.clientX, y: e.clientY }
  }, [])

  const handleMouseEnter = useCallback((e: MouseEvent) => {
    const target = e.target

    if (target && target instanceof Element && cursorRef.current) {
      const cursor = cursorRef.current

      if (target.closest('[data-cursor="hover"]')) {
        stateRef.current.isHover = true
        cursor.classList.add("hover")
      }
      if (target.closest('[data-cursor="action"]')) {
        stateRef.current.isAction = true
        cursor.classList.add("action")
      }
    }
  }, [])

  const handleMouseLeave = useCallback((e: MouseEvent) => {
    const target = e.target

    if (target && target instanceof Element && cursorRef.current) {
      const cursor = cursorRef.current

      if (
        !e.relatedTarget ||
        (e.relatedTarget instanceof Element &&
          !e.relatedTarget.closest('[data-cursor="hover"]') &&
          !e.relatedTarget.closest('[data-cursor="action"]'))
      ) {
        stateRef.current.isHover = false
        stateRef.current.isAction = false
        cursor.classList.remove("hover", "action")
      }
    }
  }, [])

  useEffect(() => {
    animationRef.current = requestAnimationFrame(updateCursor)

    document.addEventListener("mousemove", handleMouseMove, { passive: true })
    document.addEventListener("mouseenter", handleMouseEnter, true)
    document.addEventListener("mouseleave", handleMouseLeave, true)

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseenter", handleMouseEnter, true)
      document.removeEventListener("mouseleave", handleMouseLeave, true)

      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [handleMouseMove, handleMouseEnter, handleMouseLeave, updateCursor])

  return (
    <div
      ref={cursorRef}
      className="custom-cursor"
      style={{
        willChange: "transform",
        transform: "translate3d(-10px, -10px, 0)",
      }}
    />
  )
}

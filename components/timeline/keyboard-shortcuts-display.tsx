"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useCursorState } from "@/hooks/use-cursor-state"

export function KeyboardShortcutsDisplay() {
  const { keysPressed } = useCursorState()

  const getActiveShortcuts = () => {
    const shortcuts = []

    if (keysPressed.includes("Control")) {
      shortcuts.push({ key: "Ctrl + Scroll", action: "Zoom In/Out", color: "text-green-400" })
    }

    if (keysPressed.includes("Alt")) {
      shortcuts.push({ key: "Alt + Scroll", action: "View Content", color: "text-blue-400" })
    }

    if (keysPressed.includes("Shift")) {
      shortcuts.push({ key: "Shift + Scroll", action: "Navigate Minutes", color: "text-yellow-400" })
    }

    if (keysPressed.includes("t")) {
      shortcuts.push({ key: "T", action: "Add Transaction", color: "text-emerald-400" })
    }

    return shortcuts
  }

  const activeShortcuts = getActiveShortcuts()

  return (
    <div className="absolute top-4 right-4 z-20 pointer-events-none">
      <AnimatePresence>
        {activeShortcuts.map((shortcut, index) => (
          <motion.div
            key={shortcut.key}
            initial={{ opacity: 0, x: 20, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.8 }}
            transition={{
              duration: 0.2,
              delay: index * 0.05,
              type: "spring",
              stiffness: 400,
              damping: 25,
            }}
            className="mb-2 bg-black/80 backdrop-blur-md rounded-lg px-3 py-2 border border-white/10"
          >
            <div className="flex items-center gap-2 text-sm">
              <span className={`font-mono font-bold ${shortcut.color}`}>{shortcut.key}</span>
              <span className="text-white/70">→</span>
              <span className="text-white/90">{shortcut.action}</span>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

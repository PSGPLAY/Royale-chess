/**
 * useGameAudio
 * ─────────────
 * Watches GameState changes and fires the correct audio engine calls.
 * Attach this hook once at the top of the game tree (App.tsx or BoardScene).
 *
 * It does NOT import any 3D / Three.js code so it is safe to use in any
 * React context.
 */
import { useEffect, useRef } from 'react'
import type { GameState } from '../state/gameStore'
import { audioEngine } from './audioEngine'

interface AudioGameState {
  turn: GameState['turn']
  isCheck: GameState['isCheck']
  isCheckmate: GameState['isCheckmate']
  isDraw: GameState['isDraw']
  lastMove: GameState['lastMove']
  capturedPieces: GameState['capturedPieces']
  gameOver: GameState['gameOver']
  pendingPromotion: GameState['pendingPromotion']
}

export function useGameAudio(state: AudioGameState): void {
  const prev = useRef<AudioGameState>(state)

  useEffect(() => {
    const p = prev.current
    const c = state

    const moveChanged =
      c.lastMove !== null &&
      (p.lastMove?.from !== c.lastMove?.from ||
        p.lastMove?.to !== c.lastMove?.to)

    if (moveChanged) {
      // Count total captured pieces to detect a capture this turn
      const prevTotalCaps =
        p.capturedPieces.w.length + p.capturedPieces.b.length
      const currTotalCaps =
        c.capturedPieces.w.length + c.capturedPieces.b.length
      const wasCapture = currTotalCaps > prevTotalCaps

      if (c.isCheckmate) {
        audioEngine.playCheckmate()
      } else if (c.isDraw) {
        audioEngine.playDraw()
      } else if (c.isCheck) {
        audioEngine.playCheck()
      } else if (wasCapture) {
        audioEngine.playCapture()
      } else {
        audioEngine.playMove()
      }
    }

    // Game over sound (triggered when gameOver first appears)
    if (c.gameOver && !p.gameOver) {
      if (c.gameOver.winner === 'draw') {
        audioEngine.playDraw()
      } else {
        audioEngine.playVictory()
      }
    }

    // Promotion dialog opens
    if (c.pendingPromotion && !p.pendingPromotion) {
      audioEngine.playPromotion()
    }

    prev.current = c
  })
}


import { useSyncExternalStore } from 'react'
import type { SquareName } from '../types/chess'

export interface BoardState {
  selectedSquare: SquareName | null
  hoveredSquare: SquareName | null
  targetSquares: SquareName[]
  cameraView: 'isometric' | 'topDown' | 'side'
  showLabels: boolean
  isHistoryOpen: boolean
}

type Listener = () => void

class BoardStore {
  private state: BoardState = {
    selectedSquare: 'c3', // Pre-select C3 as seen in reference image
    hoveredSquare: null,
    targetSquares: ['b3', 'd3', 'c2'], // Highlight sample legal moves matching reference image
    cameraView: 'isometric',
    showLabels: true,
    isHistoryOpen: false,
  }

  private listeners = new Set<Listener>()

  getState = (): BoardState => {
    return this.state
  }

  setState = (partial: Partial<BoardState>) => {
    this.state = { ...this.state, ...partial }
    this.listeners.forEach((listener) => listener())
  }

  subscribe = (listener: Listener) => {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  selectSquare = (square: SquareName | null) => {
    if (this.state.selectedSquare === square) {
      // Toggle selection off if already selected
      this.setState({ selectedSquare: null, targetSquares: [] })
    } else {
      this.setState({ selectedSquare: square })
    }
  }

  setHoveredSquare = (square: SquareName | null) => {
    if (this.state.hoveredSquare !== square) {
      this.setState({ hoveredSquare: square })
    }
  }

  setCameraView = (cameraView: 'isometric' | 'topDown' | 'side') => {
    this.setState({ cameraView })
  }

  toggleLabels = () => {
    this.setState({ showLabels: !this.state.showLabels })
  }

  toggleHistory = () => {
    this.setState({ isHistoryOpen: !this.state.isHistoryOpen })
  }

  setHistoryOpen = (isHistoryOpen: boolean) => {
    this.setState({ isHistoryOpen })
  }
}

export const boardStore = new BoardStore()

export function useBoardStore(): BoardState {
  return useSyncExternalStore(boardStore.subscribe, boardStore.getState)
}

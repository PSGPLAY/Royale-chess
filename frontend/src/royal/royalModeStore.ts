import { useSyncExternalStore } from 'react'
import type { PieceType, PieceColor, SquareName } from '../types/chess'
import { DEFAULT_ROYAL_CONFIG } from './royalEconomyConfig'
import type { RoyalEconomyConfig } from './royalEconomyConfig'
import { audioEngine } from '../audio/audioEngine'
import { chessEngine } from '../engine/chessEngine'

export type GameMode = 'classic' | 'royal'

export const SHOP_RELOAD_COST = 1

/**
 * Rolls 3 random piece cards from the pool.
 * Weighted: Pawns 35%, Knights 25%, Bishops 20%, Rooks 13%, Queens 7%
 */
export function rollShopSlots(count = 3): PieceType[] {
  const pool: { type: PieceType; weight: number }[] = [
    { type: 'p', weight: 35 },
    { type: 'n', weight: 25 },
    { type: 'b', weight: 20 },
    { type: 'r', weight: 13 },
    { type: 'q', weight: 7 },
  ]
  const totalWeight = pool.reduce((acc, item) => acc + item.weight, 0)

  const pickPiece = (): PieceType => {
    let rand = Math.random() * totalWeight
    for (const item of pool) {
      if (rand < item.weight) return item.type
      rand -= item.weight
    }
    return 'p'
  }

  return Array.from({ length: count }, () => pickPiece())
}

export interface RoyalModeState {
  gameMode: GameMode
  wallets: { w: number; b: number }
  selectedShopSlotIndex: number | null
  selectedShopPiece: PieceType | null
  placementSquares: SquareName[]
  goldPots: SquareName[]
  shopSlots: { w: PieceType[]; b: PieceType[] } // Independent 3 slots per player!
  config: RoyalEconomyConfig
}

type Listener = () => void

class RoyalModeStore {
  private state: RoyalModeState

  constructor() {
    this.state = {
      gameMode: 'royal',
      wallets: {
        w: DEFAULT_ROYAL_CONFIG.initialCurrency,
        b: DEFAULT_ROYAL_CONFIG.initialCurrency,
      },
      selectedShopSlotIndex: null,
      selectedShopPiece: null,
      placementSquares: [],
      goldPots: [],
      shopSlots: {
        w: rollShopSlots(3),
        b: rollShopSlots(3),
      },
      config: DEFAULT_ROYAL_CONFIG,
    }
  }

  private listeners = new Set<Listener>()

  getState = (): RoyalModeState => this.state

  setState = (partial: Partial<RoyalModeState>) => {
    this.state = { ...this.state, ...partial }
    this.listeners.forEach((listener) => listener())
  }

  subscribe = (listener: Listener) => {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  /**
   * Toggles between Classic Chess and Royal Strategy Mode
   */
  setGameMode = (gameMode: GameMode) => {
    this.setState({
      gameMode,
      selectedShopSlotIndex: null,
      selectedShopPiece: null,
      placementSquares: [],
    })
  }

  /**
   * Reloads ONLY the specified player's shop slots
   * (e.g. after a player places any piece on the board)
   */
  reloadShop = (player: PieceColor) => {
    this.setState({
      shopSlots: {
        ...this.state.shopSlots,
        [player]: rollShopSlots(3),
      },
      selectedShopSlotIndex: null,
      selectedShopPiece: null,
      placementSquares: [],
    })
  }

  /**
   * Manual shop reload triggered by the player clicking the reload button.
   * Costs 1 coin and reloads ONLY that player's shop slots.
   */
  manualReloadShop = (currentTurn: PieceColor): boolean => {
    const currentFunds = this.state.wallets[currentTurn]
    if (currentFunds < SHOP_RELOAD_COST) {
      return false
    }

    audioEngine.playButtonClick()

    this.setState({
      wallets: {
        ...this.state.wallets,
        [currentTurn]: currentFunds - SHOP_RELOAD_COST,
      },
      shopSlots: {
        ...this.state.shopSlots,
        [currentTurn]: rollShopSlots(3),
      },
      selectedShopSlotIndex: null,
      selectedShopPiece: null,
      placementSquares: [],
    })
    return true
  }

  /**
   * Selects a specific shop slot (0, 1, or 2) for the active player
   */
  selectShopSlot = (
    slotIndex: number,
    currentTurn: PieceColor,
    occupiedSquares: Set<SquareName>
  ) => {
    const pieceType = this.state.shopSlots[currentTurn]?.[slotIndex]
    if (!pieceType) return

    // If already selected, toggle off
    if (this.state.selectedShopSlotIndex === slotIndex) {
      this.cancelPurchase()
      return
    }

    const cost = this.getPieceCost(pieceType)
    const currentFunds = this.state.wallets[currentTurn]

    if (currentFunds < cost) {
      return
    }

    audioEngine.playButtonClick()

    // Determine legal placement squares:
    // Players can deploy anywhere up to the center of the board (Ranks 1-4 for White, Ranks 5-8 for Black).
    // Note: Pawns cannot be placed on edge rows (Rank 1 for White, Rank 8 for Black) as per FIDE/FEN rules.
    const legalSquares: SquareName[] = []
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
    let targetRanks: string[]
    if (pieceType === 'p') {
      targetRanks = currentTurn === 'w' ? ['2', '3', '4'] : ['5', '6', '7']
    } else {
      targetRanks = currentTurn === 'w' ? ['1', '2', '3', '4'] : ['5', '6', '7', '8']
    }

    targetRanks.forEach((rank) => {
      files.forEach((file) => {
        const sq = `${file}${rank}` as SquareName
        if (!occupiedSquares.has(sq) && chessEngine.isLegalPlacement(pieceType, currentTurn, sq)) {
          legalSquares.push(sq)
        }
      })
    })

    // If king is in check and no blocking squares exist for this piece type,
    // inform and cancel (player must move their king instead)
    if (legalSquares.length === 0 && chessEngine.inCheck()) {
      // No valid placements — this piece cannot resolve the check
      return
    }

    this.setState({
      selectedShopSlotIndex: slotIndex,
      selectedShopPiece: pieceType,
      placementSquares: legalSquares,
    })
  }

  /**
   * Backward-compatible piece selector
   */
  selectShopPiece = (
    type: PieceType,
    currentTurn: PieceColor,
    occupiedSquares: Set<SquareName>
  ) => {
    const slotIdx = this.state.shopSlots[currentTurn]?.findIndex((s) => s === type)
    if (slotIdx !== undefined && slotIdx !== -1) {
      this.selectShopSlot(slotIdx, currentTurn, occupiedSquares)
    }
  }

  /**
   * Cancels active shop selection
   */
  cancelPurchase = () => {
    this.setState({
      selectedShopSlotIndex: null,
      selectedShopPiece: null,
      placementSquares: [],
    })
  }

  /**
   * Deducts match currency for a purchased piece
   */
  deductPurchaseCost = (type: PieceType, player: PieceColor): boolean => {
    const cost = this.getPieceCost(type)
    const current = this.state.wallets[player]

    if (current < cost) return false

    this.setState({
      wallets: {
        ...this.state.wallets,
        [player]: current - cost,
      },
      selectedShopSlotIndex: null,
      selectedShopPiece: null,
      placementSquares: [],
    })
    return true
  }

  /**
   * Awards match currency for completing a move
   */
  awardMoveReward = (player: PieceColor) => {
    if (this.state.gameMode !== 'royal') return
    const { rewardPerMove, maxCurrency } = this.state.config
    const current = this.state.wallets[player]
    const updated = Math.min(maxCurrency, current + rewardPerMove)

    this.setState({
      wallets: {
        ...this.state.wallets,
        [player]: updated,
      },
    })
  }

  /**
   * Awards match currency for capturing an enemy piece
   */
  awardCaptureReward = (player: PieceColor, capturedType: PieceType) => {
    if (this.state.gameMode !== 'royal') return
    const reward = this.state.config.rewardPerCapture[capturedType] || 1
    const { maxCurrency } = this.state.config
    const current = this.state.wallets[player]
    const updated = Math.min(maxCurrency, current + reward)

    this.setState({
      wallets: {
        ...this.state.wallets,
        [player]: updated,
      },
    })
  }

  /**
   * Collects a treasure cauldron on the board (deprecated)
   */
  collectGoldPot = (_square: SquareName, _collector: PieceColor): boolean => {
    return false
  }

  /**
   * Returns cost for a given piece type
   */
  getPieceCost = (type: PieceType): number => {
    const item = this.state.config.shopItems.find((i) => i.type === type)
    return item ? item.cost : 999
  }

  /**
   * Resets wallets to initial configuration & rolls 3 fresh slots for both players
   */
  resetWallets = () => {
    this.setState({
      wallets: {
        w: this.state.config.initialCurrency,
        b: this.state.config.initialCurrency,
      },
      selectedShopSlotIndex: null,
      selectedShopPiece: null,
      placementSquares: [],
      goldPots: [],
      shopSlots: {
        w: rollShopSlots(3),
        b: rollShopSlots(3),
      },
    })
  }
}

export const royalModeStore = new RoyalModeStore()

export function useRoyalModeStore(): RoyalModeState {
  return useSyncExternalStore(royalModeStore.subscribe, royalModeStore.getState)
}

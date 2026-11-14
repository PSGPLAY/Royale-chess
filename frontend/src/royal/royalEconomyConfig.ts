import type { PieceType } from '../types/chess'

export interface ShopItemConfig {
  type: PieceType
  name: string
  title: string
  cost: number
  icon: string
  color: string
  description: string
}

export interface RoyalEconomyConfig {
  initialCurrency: number
  maxCurrency: number
  rewardPerMove: number
  rewardPerCapture: {
    p: number
    n: number
    b: number
    r: number
    q: number
    k: number
  }
  shopItems: ShopItemConfig[]
}

/**
 * Royal Mode Economy Config:
 * Starts with 4 coins and King only.
 * Non-captures earn 1 coin; captures earn half the captured piece's price, rounded up.
 * Pawn: 1 coin, Knight: 2 coins, Bishop: 2 coins, Rook: 3 coins, Queen: 4 coins.
 */
export const DEFAULT_ROYAL_CONFIG: RoyalEconomyConfig = {
  initialCurrency: 4, // 4 coins starting capital
  maxCurrency: 30, // Generous ceiling so players can accumulate coins freely
  rewardPerMove: 1, // +1 coin on a legal move that does not capture
  rewardPerCapture: {
    p: 1,
    n: 1,
    b: 1,
    r: 2,
    q: 2,
    k: 0,
  },
  shopItems: [
    {
      type: 'p',
      name: 'Crewman',
      title: 'Pawn (1 Coin)',
      cost: 1,
      icon: '⚓',
      color: '#1d63ea',
      description: 'Stout frontline sailor with steady advance',
    },
    {
      type: 'n',
      name: 'Guardian',
      title: 'Knight (2 Coins)',
      cost: 2,
      icon: '🐴',
      color: '#2563eb',
      description: 'Leaping armored war steed',
    },
    {
      type: 'b',
      name: 'Navigator',
      title: 'Bishop (2 Coins)',
      cost: 2,
      icon: '🔭',
      color: '#059669',
      description: 'Diagonal sea surveyor with long-range sight',
    },
    {
      type: 'r',
      name: 'Citadel',
      title: 'Rook (3 Coins)',
      cost: 3,
      icon: '🏰',
      color: '#d97706',
      description: 'Heavy coastal fortress with broad artillery',
    },
    {
      type: 'q',
      name: 'Sovereign',
      title: 'Queen (4 Coins)',
      cost: 4,
      icon: '👑',
      color: '#7c3aed',
      description: 'Supreme commanding queen with omnidirectional sight',
    },
  ],
}

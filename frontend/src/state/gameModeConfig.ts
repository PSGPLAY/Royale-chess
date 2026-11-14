export type GameModeId =
  | 'normal'
  | 'royale'
  | 'unranked_royale'
  | 'pvp_normal'
  | 'pvp_royale'
  | 'blind'

export interface GameModeDefinition {
  id: GameModeId
  title: string
  subtitle: string
  badge?: string
  description: string
  icon: string
  isRoyaleRules: boolean
  startingFen?: string
  startingCoins?: number
  isComingSoon?: boolean
}

export const GAME_MODES: GameModeDefinition[] = [
  {
    id: 'pvp_royale',
    title: 'Royale Pass & Play',
    subtitle: 'Person vs Person Local',
    badge: 'POPULAR',
    description: 'Start with only your King and 4 coins. Recruit sailors, build your fleet, and checkmate the enemy King!',
    icon: '👑',
    isRoyaleRules: true,
    startingFen: '4k3/8/8/8/8/8/8/4K3 w - - 0 1',
    startingCoins: 4,
  },
  {
    id: 'pvp_normal',
    title: 'Normal Pass & Play',
    subtitle: 'Classic Person vs Person',
    badge: 'CLASSIC',
    description: 'Traditional 32-piece standard chess battle on the same device. Standard FIDE rules.',
    icon: '♟️',
    isRoyaleRules: false,
    startingFen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    startingCoins: 0,
  },
  {
    id: 'royale',
    title: 'Royale Strategy Mode',
    subtitle: 'King + Coins Economy',
    badge: 'FLAGSHIP',
    description: 'The definitive Royal Chess experience. Collect gold cauldrons, gain bounties, and deploy reinforcements.',
    icon: '⚔️',
    isRoyaleRules: true,
    startingFen: '4k3/8/8/8/8/8/8/4K3 w - - 0 1',
    startingCoins: 4,
  },
  {
    id: 'normal',
    title: 'Normal Chess',
    subtitle: 'Standard 8x8 Board',
    description: 'Pure, unmodified classic chess. Standard 32 pieces, castling, en passant, and promotions.',
    icon: '🏆',
    isRoyaleRules: false,
    startingFen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    startingCoins: 0,
  },
  {
    id: 'unranked_royale',
    title: 'Unranked Royale',
    subtitle: 'Casual Practice',
    badge: 'UNRANKED',
    description: 'Practice Royale tactics and experimental opening deployments without rating pressure.',
    icon: '🛡️',
    isRoyaleRules: true,
    startingFen: '4k3/8/8/8/8/8/8/4K3 w - - 0 1',
    startingCoins: 4,
  },
  {
    id: 'blind',
    title: 'Blind Chess',
    subtitle: 'Fog of War / Hidden',
    badge: 'COMING SOON',
    description: 'Future game mode with hidden enemy pieces and restricted board vision. Coming in a future update!',
    icon: '👁️',
    isRoyaleRules: false,
    isComingSoon: true,
  },
]


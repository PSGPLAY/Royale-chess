import type { FC } from 'react'
import { Coins, ShieldAlert, X, RotateCw, ScrollText } from 'lucide-react'
import { useGameStore, gameStore } from '../../state/gameStore'
import { boardStore } from '../../state/boardStore'
import { useRoyalModeStore, royalModeStore, SHOP_RELOAD_COST } from '../../royal/royalModeStore'
import { useMultiplayerStore } from '../../state/multiplayerStore'
import { chessEngine } from '../../engine/chessEngine'

export const GameHUD: FC = () => {
  const { turn, pieces } = useGameStore()
  const { isOnlineMatch, myRole } = useMultiplayerStore()
  const {
    gameMode,
    wallets,
    shopSlots,
    selectedShopSlotIndex,
    selectedShopPiece,
    config,
  } = useRoyalModeStore()

  const activeColor = (isOnlineMatch && myRole) ? myRole : turn
  const isMyTurn = !isOnlineMatch || turn === myRole
  const isKingInCheck = isMyTurn && chessEngine.inCheck()
  const currentFunds = wallets?.[activeColor] ?? 4
  const occupiedSquares = new Set(pieces.map((p) => p.square))
  const canAffordReload = isMyTurn && !isKingInCheck && currentFunds >= SHOP_RELOAD_COST

  // Ensure 3 valid shop slots are always available to render
  const playerSlots = (shopSlots && shopSlots[activeColor] && shopSlots[activeColor].length > 0)
    ? shopSlots[activeColor]
    : ['p', 'n', 'b']

  return (
    <footer className={`game-hud-bar ${gameMode === 'royal' ? 'has-royal-shop' : 'classic-hud'}`}>
      {/* 1. Battle Log / Move History Drawer Button */}
      <button
        className="hud-chat-btn"
        onClick={() => boardStore.toggleHistory()}
        title="View Match Move History & Battle Log"
      >
        <ScrollText size={20} />
      </button>

      {/* 2. Match Coin Purse / Wallet */}
      <div
        className={`currency-bottle-card ${activeColor === 'w' ? 'glow-blue' : 'glow-red'}`}
        title="Earn +1 coin on every move! Spend coins to recruit pieces."
      >
        <div className="bottle-icon-wrapper">
          <div className="potion-glow" />
          <span className="potion-emoji">🪙</span>
        </div>
        <div className="currency-numbers">
          <span className="curr-amount">
            {currentFunds}{' '}
            <small style={{ fontSize: '0.65em', color: '#ffd700' }}>COINS</small>
          </span>
          <span className="curr-max">
            {isOnlineMatch
              ? `${activeColor === 'w' ? 'Blue' : 'Red'} (You) | Opponent: ${activeColor === 'w' ? wallets.b : wallets.w}`
              : `+1 per move | B:${wallets.w} R:${wallets.b}`}
          </span>
        </div>
      </div>

      {/* 3. 3-Slot Purchasable Strategy Cards Deck + Reload Button (Active in Royal Mode) */}
      {gameMode === 'royal' && (
        <div className="hud-cards-tray">
          {/* Exactly 3 dynamic shop slots for the active player */}
          {playerSlots.map((pieceType, slotIdx) => {
            const card = config.shopItems.find((i) => i.type === pieceType)
            if (!card) return null

            const canAfford = isMyTurn && currentFunds >= card.cost
            const isSelected = selectedShopSlotIndex === slotIdx

            return (
              <div
                key={`slot-${slotIdx}-${pieceType}`}
                className={`hud-unit-card ${canAfford ? 'affordable' : 'unaffordable'} ${
                  isSelected ? 'selected-shop-card' : ''
                }`}
                tabIndex={0}
                onClick={() => {
                  if (!isMyTurn) return
                  royalModeStore.selectShopSlot(slotIdx, activeColor, occupiedSquares)
                }}
              >
                <div
                  className="card-badge"
                  style={{ backgroundColor: canAfford ? card.color : '#6b7280' }}
                >
                  <span>+</span>
                </div>
                <div className="card-illustration">{card.icon}</div>
                <div className="card-footer">
                  <Coins size={12} className="card-coin-icon" />
                  <span className="card-cost">{card.cost}</span>
                </div>
                <span className="card-tooltip">
                  Slot #{slotIdx + 1}: {card.title} {!isMyTurn && "(Wait for your turn)"}
                </span>
              </div>
            )
          })}

          {/* Reroll / Reload Shop Button (Costs 1 Coin & Skips Turn) */}
          <button
            className={`hud-reload-btn ${canAffordReload ? 'can-reload' : 'cannot-reload'}`}
            onClick={() => {
              if (!isMyTurn) return
              gameStore.handleReloadShop(activeColor)
            }}
            disabled={!canAffordReload}
            title={
              !isMyTurn
                ? "Wait for opponent's turn"
                : isKingInCheck
                ? "Cannot reroll while your King is in check! Block or move your King."
                : canAffordReload
                ? 'Reroll Your 3 Shop Slots (Costs 1 Coin & Skips Your Turn)'
                : 'Need at least 1 Coin to Reroll'
            }
          >
            <RotateCw size={15} className="reload-icon" />
            <span className="reload-label">Reroll</span>
            <div className="reload-cost-tag">
              <Coins size={10} />
              <span>{SHOP_RELOAD_COST}</span>
            </div>
          </button>

          {/* Cancel active placement */}
          {selectedShopPiece && (
            <button
              className="btn-cancel-placement"
              onClick={() => royalModeStore.cancelPurchase()}
              title="Cancel Piece Deployment"
            >
              <X size={14} />
              <span>Cancel</span>
            </button>
          )}
        </div>
      )}

      {/* 4. Match Turn Indicator */}
      <div className={`hud-turn-indicator ${turn === 'w' ? 'turn-blue' : 'turn-red'}`}>
        <ShieldAlert size={16} className="turn-pulse-icon" />
        <span>
          {isOnlineMatch
            ? isMyTurn
              ? 'Your Turn!'
              : "Opponent's Turn"
            : turn === 'w'
            ? 'Blue Turn'
            : 'Red Turn'}
        </span>
      </div>
    </footer>
  )
}

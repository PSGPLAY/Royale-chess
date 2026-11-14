import type { FC } from 'react'
import { useEffect, useRef } from 'react'
import { X, ScrollText, Swords, ShieldAlert, Sparkles, RotateCw } from 'lucide-react'
import { useGameStore } from '../../state/gameStore'
import { useBoardStore, boardStore } from '../../state/boardStore'
import type { MoveHistoryEntry, MoveActionType } from '../../types/chess'

const ACTION_COLORS: Record<MoveActionType, { bg: string; text: string; label: string }> = {
  deploy: { bg: 'rgba(34, 197, 94, 0.2)', text: '#4ade80', label: 'SPAWN' },
  move: { bg: 'rgba(59, 130, 246, 0.2)', text: '#60a5fa', label: 'MOVE' },
  capture: { bg: 'rgba(239, 68, 68, 0.2)', text: '#f87171', label: 'TAKE' },
  castle: { bg: 'rgba(234, 179, 8, 0.2)', text: '#facc15', label: 'CASTLE' },
  promotion: { bg: 'rgba(168, 85, 247, 0.2)', text: '#c084fc', label: 'PROMOTE' },
  reroll: { bg: 'rgba(249, 115, 22, 0.2)', text: '#fb923c', label: 'REROLL' },
}

export const MoveHistoryPanel: FC = () => {
  const { moveHistory } = useGameStore()
  const { isHistoryOpen } = useBoardStore()
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to the bottom when new moves arrive
  useEffect(() => {
    if (isHistoryOpen && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [moveHistory.length, isHistoryOpen])

  if (!isHistoryOpen) return null

  return (
    <div className="history-panel-overlay" onClick={() => boardStore.setHistoryOpen(false)}>
      <div className="history-panel-drawer" onClick={(e) => e.stopPropagation()}>
        {/* Drawer Header */}
        <div className="history-header">
          <div className="history-title-group">
            <ScrollText size={18} className="history-icon" />
            <h3 className="history-title">Battle Log & Move History</h3>
            <span className="history-count-badge">{moveHistory.length} actions</span>
          </div>
          <button
            className="history-close-btn"
            onClick={() => boardStore.setHistoryOpen(false)}
            title="Close Battle Log"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable List of Actions */}
        <div className="history-entries-list" ref={scrollRef}>
          {moveHistory.length === 0 ? (
            <div className="history-empty-state">
              <Swords size={36} className="empty-icon" />
              <p className="empty-title">Awaiting First Move</p>
              <p className="empty-desc">
                Deploy pieces from the shop or move your King to start recording the match history!
              </p>
            </div>
          ) : (
            moveHistory.map((entry: MoveHistoryEntry) => {
              const actionMeta = ACTION_COLORS[entry.action] || {
                bg: 'rgba(255, 255, 255, 0.1)',
                text: '#fff',
                label: 'ACTION',
              }
              const isWhite = entry.player === 'w'

              return (
                <div
                  key={entry.id}
                  className={`history-entry-card ${isWhite ? 'entry-white' : 'entry-black'}`}
                  onClick={() => {
                    if (entry.toSquare !== '--') {
                      boardStore.selectSquare(entry.toSquare)
                    }
                  }}
                  title="Click to highlight square on board"
                >
                  <div className="entry-left">
                    <span className="entry-turn-num">#{entry.turnNumber}</span>
                    <div className={`entry-team-pill ${isWhite ? 'team-blue' : 'team-red'}`}>
                      <span>{isWhite ? 'BLUE' : 'RED'}</span>
                    </div>
                  </div>

                  <div className="entry-main">
                    <div className="entry-top-row">
                      <span className="entry-piece-icon">{entry.icon}</span>
                      <span
                        className="entry-action-tag"
                        style={{ backgroundColor: actionMeta.bg, color: actionMeta.text }}
                      >
                        {actionMeta.label}
                      </span>
                      {entry.san && <span className="entry-san">{entry.san}</span>}
                      {entry.isCheckmate && (
                        <span className="entry-checkmate-tag">
                          <Sparkles size={11} /> CHECKMATE
                        </span>
                      )}
                      {entry.isCheck && !entry.isCheckmate && (
                        <span className="entry-check-tag">
                          <ShieldAlert size={11} /> CHECK
                        </span>
                      )}
                      {entry.action === 'reroll' && (
                        <span className="entry-reroll-tag">
                          <RotateCw size={11} /> -1 🪙
                        </span>
                      )}
                    </div>

                    <p className="entry-description-text">{entry.description}</p>
                  </div>

                  {entry.toSquare !== '--' && (
                    <div className="entry-dest-badge">
                      <span>{entry.toSquare.toUpperCase()}</span>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* Footer info */}
        <div className="history-footer">
          <small>Click any move to highlight that square on the 3D board</small>
        </div>
      </div>
    </div>
  )
}


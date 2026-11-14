import { useSyncExternalStore } from 'react'
import type { SquareName, PieceColor, PieceType, PlacedChessPiece, MoveHistoryEntry, MoveActionType } from '../types/chess'
import { chessEngine } from '../engine/chessEngine'
import { royalModeStore } from '../royal/royalModeStore'
import { multiplayerStore } from './multiplayerStore'
import { squareToWorld, TILE_HEIGHT } from '../utils/boardCoordinates'
import { audioEngine } from '../audio/audioEngine'

export const PIECE_NAMES: Record<PieceType, string> = {
  p: 'Pawn',
  n: 'Knight',
  b: 'Bishop',
  r: 'Rook',
  q: 'Queen',
  k: 'King',
}

export const PIECE_ICONS: Record<PieceType, string> = {
  p: '♟️',
  n: '♞',
  b: '♝',
  r: '♜',
  q: '♛',
  k: '♚',
}

export interface AnimatingPiece {
  pieceId: string
  fromSquare: SquareName
  toSquare: SquareName
  fromPos: [number, number, number]
  toPos: [number, number, number]
  startTime: number
  duration: number
}

export interface GameOverInfo {
  winner: 'w' | 'b' | 'draw'
  winnerTitle: string
  reason: string
  movesCount: number
}

export interface GameState {
  pieces: PlacedChessPiece[]
  selectedSquare: SquareName | null
  validMoves: SquareName[]
  lastMove: { from: SquareName; to: SquareName } | null
  turn: PieceColor
  isCheck: boolean
  isCheckmate: boolean
  isDraw: boolean
  statusMessage: string
  capturedPieces: { w: string[]; b: string[] }
  animatingPiece: AnimatingPiece | null
  gameOver: GameOverInfo | null
  pendingPromotion: { from: SquareName; to: SquareName } | null
  moveHistory: MoveHistoryEntry[]
}

type Listener = () => void

class GameStore {
  private state: GameState

  constructor() {
    this.state = {
      pieces: chessEngine.getBoardPieces(),
      selectedSquare: null,
      validMoves: [],
      lastMove: null,
      turn: chessEngine.getTurn(),
      isCheck: false,
      isCheckmate: false,
      isDraw: false,
      statusMessage: 'Blue Turn to Move',
      capturedPieces: { w: [], b: [] },
      animatingPiece: null,
      gameOver: null,
      pendingPromotion: null,
      moveHistory: [],
    }
  }

  private listeners = new Set<Listener>()

  getState = (): GameState => this.state

  private setState = (partial: Partial<GameState>) => {
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
   * Main player interaction: clicking a square or piece on the board
   */
  handleSquareClick = (square: SquareName) => {
    const { selectedSquare, validMoves, turn, animatingPiece, pendingPromotion } = this.state

    // Ignore clicks during active animation or when promotion selection is open
    if (animatingPiece || pendingPromotion) return

    // If online match, only allow actions when it is our turn
    const isOnline = multiplayerStore.getState().isOnlineMatch
    const myRole = multiplayerStore.getState().myRole
    if (isOnline && turn !== myRole) return

    // Case 0: Royal Mode Shop Piece Placement
    const royalState = royalModeStore.getState()

    // If king is in check and player tries to click a shop card location that doesn't block:
    // placementSquares already only contains valid BLOCKING squares (filtered by isLegalPlacement),
    // so this check is naturally enforced. If the player clicks outside those squares, cancel.
    if (royalState.selectedShopPiece && !royalState.placementSquares.includes(square)) {
      // Clicked outside valid placement zones — deselect shop piece
      royalModeStore.cancelPurchase()
      return
    }

    if (royalState.selectedShopPiece && royalState.placementSquares.includes(square)) {
      const pieceType = royalState.selectedShopPiece
      const success = chessEngine.deployPiece(pieceType, turn, square)

      if (success) {
        audioEngine.playDeploy()
        royalModeStore.deductPurchaseCost(pieceType, turn)
        // Automatically reload only the active player's shop slots with 3 new pieces
        royalModeStore.reloadShop(turn)
        const nextPieces = chessEngine.getBoardPieces()
        const nextTurn = chessEngine.getTurn()
        const teamName = nextTurn === 'w' ? 'Blue' : 'Red'
        const playerLabel = turn === 'w' ? 'Blue' : 'Red'
        const pieceName = PIECE_NAMES[pieceType]
        const pieceIcon = PIECE_ICONS[pieceType]

        const newEntry: MoveHistoryEntry = {
          id: `hist-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          turnNumber: this.state.moveHistory.length + 1,
          player: turn,
          action: 'deploy',
          pieceType,
          pieceName,
          icon: pieceIcon,
          toSquare: square,
          description: `${playerLabel} spawned ${pieceName} at ${square.toUpperCase()} (blocked check!)`,
          timestamp: Date.now(),
        }

        this.setState({
          pieces: nextPieces,
          turn: nextTurn,
          selectedSquare: null,
          validMoves: [],
          statusMessage: `${teamName} Turn to Move`,
          moveHistory: [...this.state.moveHistory, newEntry],
        })

        if (isOnline) {
          multiplayerStore.sendOnlineDeploy(pieceType, square)
        }
      } else {
        royalModeStore.cancelPurchase()
      }
      return
    }

    const pieceOnSquare = chessEngine.getPiece(square)

    // Case 1: A piece was selected and player clicks a legal destination -> Move or Prompt Promotion
    if (selectedSquare && validMoves.includes(square)) {
      if (chessEngine.isPromotionMove(selectedSquare, square)) {
        // Open promotion dialog
        this.setState({
          pendingPromotion: { from: selectedSquare, to: square },
          selectedSquare: null,
          validMoves: [],
        })
      } else {
        this.executeMove(selectedSquare, square)
      }
      return
    }

    // Case 2: Player clicked their own piece -> Toggle or switch selection
    if (pieceOnSquare && pieceOnSquare.color === turn) {
      if (selectedSquare === square) {
        this.setState({
          selectedSquare: null,
          validMoves: [],
        })
      } else {
        const moves = chessEngine.getLegalMoves(square)
        this.setState({
          selectedSquare: square,
          validMoves: moves,
        })
      }
      return
    }

    // Case 3: Player clicked an empty or illegal square -> Deselect
    if (selectedSquare) {
      this.setState({
        selectedSquare: null,
        validMoves: [],
      })
    }
  }

  /**
   * Completes a promotion with the chosen piece type ('q', 'r', 'b', 'n')
   */
  confirmPromotion = (promotionPiece: PieceType) => {
    const { pendingPromotion } = this.state
    if (!pendingPromotion) return

    const { from, to } = pendingPromotion
    this.setState({ pendingPromotion: null })
    this.executeMove(from, to, promotionPiece)
  }

  /**
   * Cancels an open promotion modal
   */
  cancelPromotion = () => {
    this.setState({ pendingPromotion: null })
  }

  /**
   * Reloads the active player's independent shop slots for 1 coin and skips their turn to the opponent
   */
  handleReloadShop = (player: PieceColor) => {
    const { animatingPiece, pendingPromotion, turn } = this.state
    if (animatingPiece || pendingPromotion) return

    // Cannot reroll / pass turn while King is in check!
    if (chessEngine.inCheck()) {
      this.setState({ statusMessage: 'Your King is in check! You must move your King or block with a spawned piece.' })
      return
    }

    const isOnline = multiplayerStore.getState().isOnlineMatch
    const myRole = multiplayerStore.getState().myRole
    if (isOnline && turn !== myRole) return

    const success = royalModeStore.manualReloadShop(player)
    if (success) {
      if (isOnline) {
        multiplayerStore.sendOnlineReroll()
      }
      // Player spent 1 coin to reload their shop, which passes/skips their turn to the opponent
      const nextTurn = chessEngine.skipTurn()
      const teamName = nextTurn === 'w' ? 'Blue' : 'Red'
      const playerLabel = player === 'w' ? 'Blue' : 'Red'

      const newEntry: MoveHistoryEntry = {
        id: `hist-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        turnNumber: this.state.moveHistory.length + 1,
        player,
        action: 'reroll',
        pieceName: 'Reroll',
        icon: '🔄',
        toSquare: '--',
        description: `${playerLabel} rerolled shop (-1 🪙, turn passed)`,
        timestamp: Date.now(),
      }

      this.setState({
        turn: nextTurn,
        selectedSquare: null,
        validMoves: [],
        statusMessage: `${teamName} Turn to Move`,
        moveHistory: [...this.state.moveHistory, newEntry],
      })
    }
  }

  /**
   * Executes a verified move with smooth animation and checks for game over
   */
  private executeMove = (from: SquareName, to: SquareName, promotion = 'q') => {
    const movingPiece = this.state.pieces.find((p) => p.square === from)
    if (!movingPiece) return
    const moverColor = movingPiece.color

    const fromPos = squareToWorld(from, TILE_HEIGHT)
    const toPos = squareToWorld(to, TILE_HEIGHT)

    const animation: AnimatingPiece = {
      pieceId: movingPiece.id,
      fromSquare: from,
      toSquare: to,
      fromPos,
      toPos,
      startTime: performance.now(),
      duration: 320,
    }

    this.setState({
      animatingPiece: animation,
      selectedSquare: null,
      validMoves: [],
    })

    setTimeout(() => {
      const result = chessEngine.makeMove(from, to, promotion)

      if (result.success) {
        const nextPieces = chessEngine.getBoardPieces()
        const nextTurn = chessEngine.getTurn()
        const teamName = nextTurn === 'w' ? 'Blue' : 'Red'

        let status = `${teamName} Turn to Move`
        if (result.isCheckmate) {
          const winner = nextTurn === 'w' ? 'Red' : 'Blue'
          status = `Checkmate! ${winner} Wins!`
        } else if (result.isCheck) {
          // In Royale mode, hint that the player can also spawn a piece to block
          const isRoyale = royalModeStore.getState().gameMode === 'royal'
          status = isRoyale
            ? `⚠️ Check! ${teamName} King in Danger! (Move king or spawn a piece to block)`
            : `Check! ${teamName} King in Danger!`
        } else if (result.isDraw) {
          status = 'Draw!'
        }

        const updatedCaptured = { ...this.state.capturedPieces }
        if (result.capturedPiece) {
          if (result.capturedPiece.color === 'w') {
            updatedCaptured.w = [...updatedCaptured.w, result.capturedPiece.type]
          } else {
            updatedCaptured.b = [...updatedCaptured.b, result.capturedPiece.type]
          }
        }

        // Check if game has ended
        let gameOverDetails = chessEngine.getGameOverDetails()

        // ── Royale Mode: chess.js may declare checkmate when the player can still
        //    escape by spawning a piece from their shop. Override that false positive.
        if (
          gameOverDetails.isOver &&
          gameOverDetails.reason === 'Checkmate' &&
          royalModeStore.getState().gameMode === 'royal'
        ) {
          // The player who is NOW to move is the one who was checkmated
          const loser = chessEngine.getTurn() // after the move, it is the loser's turn
          const royalState = royalModeStore.getState()
          const loserShop = royalState.shopSlots[loser]
          const loserWallet = royalState.wallets[loser]
          const nextPiecesForCheck = chessEngine.getBoardPieces()
          const occupiedForCheck = new Set(nextPiecesForCheck.map((p) => p.square))
          if (chessEngine.hasAnyLegalSpawn(loserShop, loserWallet, loser, occupiedForCheck)) {
            // Player can still block the check by spawning — NOT a true checkmate yet
            gameOverDetails = { isOver: false }
          }
        }

        let gameOverInfo: GameOverInfo | null = null

        if (gameOverDetails.isOver) {
          const movesCount = chessEngine.getHistory().length
          const winner = gameOverDetails.winner || 'draw'
          let winnerTitle = 'MATCH DRAW!'
          if (winner === 'w') winnerTitle = 'ROYAL BLUE CREW WINS!'
          if (winner === 'b') winnerTitle = 'CRIMSON RED CREW WINS!'

          gameOverInfo = {
            winner,
            winnerTitle,
            reason: gameOverDetails.reason || 'Checkmate',
            movesCount,
          }
        }

        // Royal Mode match currency rewards:
        // Any player who moves receives coins to help them buy pieces from the shop!
        const isRoyale = royalModeStore.getState().gameMode === 'royal'
        if (isRoyale) {
          if (result.capturedPiece) {
            royalModeStore.awardCaptureReward(moverColor, result.capturedPiece.type)
          } else {
            royalModeStore.awardMoveReward(moverColor)
          }
        }

        const playerLabel = moverColor === 'w' ? 'Blue' : 'Red'
        const movingPieceName = PIECE_NAMES[movingPiece.type]
        const movingPieceIcon = PIECE_ICONS[movingPiece.type]
        let desc = `${playerLabel} moved ${movingPieceName} ${from.toUpperCase()} → ${to.toUpperCase()}`
        let actionType: MoveActionType = 'move'

        if (result.capturedPiece) {
          actionType = 'capture'
          const capturedName = PIECE_NAMES[result.capturedPiece.type]
          desc = `${playerLabel} ${movingPieceName} captured ${capturedName} at ${to.toUpperCase()}`
        }

        if (result.move?.flags.includes('k') || result.move?.flags.includes('q')) {
          actionType = 'castle'
          desc = `${playerLabel} King castled`
        }

        if (result.move?.promotion) {
          actionType = 'promotion'
          desc = `${playerLabel} Pawn promoted to ${PIECE_NAMES[result.move.promotion as PieceType]} at ${to.toUpperCase()}`
        }

        const newEntry: MoveHistoryEntry = {
          id: `hist-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          turnNumber: this.state.moveHistory.length + 1,
          player: moverColor,
          action: actionType,
          pieceType: movingPiece.type,
          pieceName: movingPieceName,
          icon: movingPieceIcon,
          fromSquare: from,
          toSquare: to,
          description: desc,
          san: result.move?.san,
          isCheck: result.isCheck,
          isCheckmate: result.isCheckmate,
          timestamp: Date.now(),
        }

        this.setState({
          pieces: nextPieces,
          lastMove: { from, to },
          turn: nextTurn,
          isCheck: result.isCheck,
          isCheckmate: result.isCheckmate,
          isDraw: result.isDraw,
          statusMessage: status,
          capturedPieces: updatedCaptured,
          animatingPiece: null,
          gameOver: gameOverInfo,
          moveHistory: [...this.state.moveHistory, newEntry],
        })

        const isOnline = multiplayerStore.getState().isOnlineMatch
        if (isOnline) {
          multiplayerStore.sendOnlineMove(from, to, promotion)
        }
      } else {
        this.setState({ animatingPiece: null })
      }
    }, animation.duration)
  }

  /**
   * Dismisses the game over modal so player can review the final board position
   */
  dismissGameOverModal = () => {
    this.setState({ gameOver: null })
  }

  setGameOver = (gameOverInfo: GameOverInfo | null) => {
    this.setState({ gameOver: gameOverInfo })
  }

  /**
   * Loads a server-authoritative FEN and turn state (for online multiplayer)
   */
  loadServerFen = (fen: string, turn: PieceColor) => {
    const isRoyale = royalModeStore.getState().gameMode === 'royal'
    chessEngine.reset(fen, isRoyale)
    const teamName = turn === 'w' ? 'Blue' : 'Red'
    this.setState({
      pieces: chessEngine.getBoardPieces(),
      turn,
      selectedSquare: null,
      validMoves: [],
      statusMessage: `${teamName} Turn to Move`,
    })
  }

  /**
   * Starts a new match with custom FEN (e.g. Kings-only for Royale Mode)
   */
  startMatchWithFen = (fen?: string, modeTitle?: string, isRoyaleMode = false) => {
    chessEngine.reset(fen, isRoyaleMode)
    royalModeStore.resetWallets()
    this.setState({
      pieces: chessEngine.getBoardPieces(),
      selectedSquare: null,
      validMoves: [],
      lastMove: null,
      turn: chessEngine.getTurn(),
      isCheck: false,
      isCheckmate: false,
      isDraw: false,
      statusMessage: modeTitle ? `${modeTitle} - Blue to Move` : 'Blue Turn to Move',
      capturedPieces: { w: [], b: [] },
      animatingPiece: null,
      gameOver: null,
      pendingPromotion: null,
      moveHistory: [],
    })
  }

  /**
   * Resets the entire match to the initial starting state
   */
  resetGame = () => {
    const isRoyale = royalModeStore.getState().gameMode === 'royal'
    chessEngine.reset(undefined, isRoyale)
    royalModeStore.resetWallets()
    this.setState({
      pieces: chessEngine.getBoardPieces(),
      selectedSquare: null,
      validMoves: [],
      lastMove: null,
      turn: chessEngine.getTurn(),
      isCheck: false,
      isCheckmate: false,
      isDraw: false,
      statusMessage: 'Blue Turn to Move',
      capturedPieces: { w: [], b: [] },
      animatingPiece: null,
      gameOver: null,
      pendingPromotion: null,
      moveHistory: [],
    })
  }
}

export const gameStore = new GameStore()

export function useGameStore(): GameState {
  return useSyncExternalStore(gameStore.subscribe, gameStore.getState)
}

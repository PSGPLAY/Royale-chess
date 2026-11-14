import { Chess } from 'chess.js'
import type { Square, Move } from 'chess.js'
import type { PieceColor, PieceType, SquareName, PlacedChessPiece } from '../types/chess'

export interface MoveResult {
  success: boolean
  move?: Move
  isCheck: boolean
  isCheckmate: boolean
  isDraw: boolean
  isStalemate: boolean
  capturedPiece?: { square: SquareName; type: PieceType; color: PieceColor }
}

export class ChessEngine {
  private chess: Chess
  private isRoyaleMode = false

  constructor(fen?: string, isRoyaleMode = false) {
    this.chess = new Chess(fen)
    this.isRoyaleMode = isRoyaleMode
  }

  /**
   * Configures whether Royale mode rules are active (disables false insufficient-material draws)
   */
  setRoyaleMode(enabled: boolean): void {
    this.isRoyaleMode = enabled
  }

  getIsRoyaleMode(): boolean {
    return this.isRoyaleMode
  }

  /**
   * Returns current active turn: 'w' (White/Blue) or 'b' (Black/Red)
   */
  getTurn(): PieceColor {
    return this.chess.turn() as PieceColor
  }

  /**
   * Returns whether a piece exists on the given square and its metadata
   */
  getPiece(square: SquareName): { type: PieceType; color: PieceColor } | null {
    const piece = this.chess.get(square as Square)
    if (!piece) return null
    return {
      type: piece.type as PieceType,
      color: piece.color as PieceColor,
    }
  }

  /**
   * Returns all legal destination squares for the piece on `square`
   */
  getLegalMoves(square: SquareName): SquareName[] {
    const moves = this.chess.moves({
      square: square as Square,
      verbose: true,
    }) as Move[]

    // Kings can NEVER be captured in chess! Filter out any move that lands on a King
    return moves
      .filter((m) => {
        if (m.captured === 'k') return false
        const targetPiece = this.getPiece(m.to as SquareName)
        if (targetPiece && targetPiece.type === 'k') return false
        return true
      })
      .map((m) => m.to as SquareName)
  }

  /**
   * Checks if moving a pawn to `to` triggers promotion
   */
  isPromotionMove(from: SquareName, to: SquareName): boolean {
    const piece = this.getPiece(from)
    if (!piece || piece.type !== 'p') return false
    return (piece.color === 'w' && to.endsWith('8')) || (piece.color === 'b' && to.endsWith('1'))
  }

  /**
   * Executes a move on the board if legal
   */
  makeMove(from: SquareName, to: SquareName, promotion = 'q'): MoveResult {
    try {
      const sourcePiece = this.getPiece(from)
      if (!sourcePiece) {
        return { success: false, isCheck: false, isCheckmate: false, isDraw: false, isStalemate: false }
      }

      const targetPiece = this.getPiece(to)
      // Kings can NEVER be captured in chess! Reject moves targeting a King
      if (targetPiece && targetPiece.type === 'k') {
        return { success: false, isCheck: false, isCheckmate: false, isDraw: false, isStalemate: false }
      }
      let capturedPieceInfo: { square: SquareName; type: PieceType; color: PieceColor } | undefined

      if (targetPiece) {
        capturedPieceInfo = {
          square: to,
          type: targetPiece.type,
          color: targetPiece.color,
        }
      }

      const move = this.chess.move({
        from: from as Square,
        to: to as Square,
        promotion: sourcePiece.type === 'p' && (to.endsWith('8') || to.endsWith('1')) ? promotion : undefined,
      })

      if (!move) {
        return { success: false, isCheck: false, isCheckmate: false, isDraw: false, isStalemate: false }
      }

      // Handle en-passant capture
      if (move.flags.includes('e') && !capturedPieceInfo) {
        const epRank = sourcePiece.color === 'w' ? '5' : '4'
        const epSquare = `${to[0]}${epRank}` as SquareName
        capturedPieceInfo = {
          square: epSquare,
          type: 'p',
          color: sourcePiece.color === 'w' ? 'b' : 'w',
        }
      }

      // In Royale mode, insufficient material does NOT count as a draw because players can buy pieces with coins
      const isDraw = this.isRoyaleMode
        ? (this.chess.isStalemate() || this.chess.isThreefoldRepetition())
        : this.chess.isDraw()

      return {
        success: true,
        move,
        isCheck: this.chess.inCheck(),
        isCheckmate: this.chess.isCheckmate(),
        isDraw,
        isStalemate: this.chess.isStalemate(),
        capturedPiece: capturedPieceInfo,
      }
    } catch {
      return { success: false, isCheck: false, isCheckmate: false, isDraw: false, isStalemate: false }
    }
  }

  /**
   * Resolves detailed game over state (who won and how)
   */
  getGameOverDetails(): { isOver: boolean; winner?: 'w' | 'b' | 'draw'; reason?: string } {
    if (this.isRoyaleMode) {
      // In Royale mode, players can purchase pieces with coins at any time.
      // Therefore, King vs King never ends the game in a draw! Only checkmate or stalemate.
      if (this.chess.isCheckmate()) {
        const winner = this.chess.turn() === 'w' ? 'b' : 'w'
        return {
          isOver: true,
          winner,
          reason: 'Checkmate',
        }
      }

      if (this.chess.isStalemate()) {
        return {
          isOver: true,
          winner: 'draw',
          reason: 'Stalemate',
        }
      }

      if (this.chess.isThreefoldRepetition()) {
        return {
          isOver: true,
          winner: 'draw',
          reason: 'Threefold Repetition',
        }
      }

      return { isOver: false }
    }

    if (!this.chess.isGameOver()) {
      return { isOver: false }
    }

    if (this.chess.isCheckmate()) {
      const winner = this.chess.turn() === 'w' ? 'b' : 'w'
      return {
        isOver: true,
        winner,
        reason: 'Checkmate',
      }
    }

    if (this.chess.isStalemate()) {
      return {
        isOver: true,
        winner: 'draw',
        reason: 'Stalemate',
      }
    }

    if (this.chess.isThreefoldRepetition()) {
      return {
        isOver: true,
        winner: 'draw',
        reason: 'Threefold Repetition',
      }
    }

    if (this.chess.isInsufficientMaterial()) {
      return {
        isOver: true,
        winner: 'draw',
        reason: 'Insufficient Material',
      }
    }

    if (this.chess.isDraw()) {
      return {
        isOver: true,
        winner: 'draw',
        reason: '50-Move Draw Rule',
      }
    }

    return {
      isOver: true,
      winner: 'draw',
      reason: 'Draw',
    }
  }

  /**
   * Checks whether deploying `type` for `color` on `square` is legal.
   * Ensures the square is empty, pawn ranks are respected (not rank 1 or 8),
   * and the deployment does NOT leave the player's King in check.
   */
  isLegalPlacement(type: PieceType, color: PieceColor, square: SquareName): boolean {
    if (type === 'p' && (square.endsWith('1') || square.endsWith('8'))) {
      return false
    }

    if (this.chess.get(square as Square)) {
      return false
    }

    // Temporarily place the piece to inspect board legality
    const success = this.chess.put({ type, color }, square as Square)
    if (!success) return false

    // Before toggling turn, this.chess.turn() is the active player's turn.
    // this.chess.inCheck() verifies whether the active player's King is in check.
    const leavesKingInCheck = this.chess.inCheck()

    // Always remove test placement
    this.chess.remove(square as Square)

    return !leavesKingInCheck
  }

  /**
   * Deploys a newly purchased piece in Royal Mode onto an empty square and switches turns
   */
  deployPiece(type: PieceType, color: PieceColor, square: SquareName): boolean {
    try {
      // Disallow pawns on edge rows (Rank 1 and Rank 8) as per FIDE / FEN rules
      if (type === 'p' && (square.endsWith('1') || square.endsWith('8'))) {
        return false
      }

      // Check if square is already occupied
      if (this.chess.get(square as Square)) {
        return false
      }

      const success = this.chess.put({ type, color }, square as Square)
      if (!success) return false

      // Verify that this deployment does NOT leave the player's King in check!
      if (this.chess.inCheck()) {
        this.chess.remove(square as Square)
        return false
      }

      // Toggle active turn in FEN
      const tokens = this.chess.fen().split(' ')
      tokens[1] = tokens[1] === 'w' ? 'b' : 'w'
      try {
        this.chess.load(tokens.join(' '))
        return true
      } catch {
        // Rollback put on failure so ghost pieces do not linger on the board
        this.chess.remove(square as Square)
        return false
      }
    } catch {
      return false
    }
  }

  /**
   * Skips / passes the active player's turn to the opponent (e.g. when reloading the shop)
   */
  skipTurn(): PieceColor {
    try {
      const tokens = this.chess.fen().split(' ')
      tokens[1] = tokens[1] === 'w' ? 'b' : 'w'
      this.chess.load(tokens.join(' '))
      return this.getTurn()
    } catch {
      return this.getTurn()
    }
  }

  /**
   * Generates the current list of pieces on the 8x8 board from the FEN state
   */
  getBoardPieces(): PlacedChessPiece[] {
    const pieces: PlacedChessPiece[] = []
    const board = this.chess.board()

    board.forEach((row, rankIdx) => {
      row.forEach((cell, fileIdx) => {
        if (cell) {
          const file = String.fromCharCode('a'.charCodeAt(0) + fileIdx)
          const rank = (8 - rankIdx).toString()
          const square = `${file}${rank}` as SquareName

          pieces.push({
            id: `${cell.color}-${cell.type}-${square}`,
            square,
            type: cell.type as PieceType,
            color: cell.color as PieceColor,
          })
        }
      })
    })

    return pieces
  }

  /**
   * Resets the game to standard starting position or custom FEN (e.g. Kings-only Royale)
   */
  reset(fen?: string, isRoyaleMode?: boolean): void {
    if (isRoyaleMode !== undefined) {
      this.isRoyaleMode = isRoyaleMode
    }
    if (fen) {
      this.chess.load(fen)
    } else {
      this.chess.reset()
    }
  }

  /**
   * Returns history of SAN moves
   */
  getHistory(): string[] {
    return this.chess.history()
  }

  inCheck(): boolean {
    return this.chess.inCheck()
  }

  isCheckmate(): boolean {
    return this.chess.isCheckmate()
  }

  /**
   * Returns true if the given player has at least ONE shop piece they can afford
   * and legally spawn to block an active check.
   * Used by Royale Mode to prevent false checkmates when a spawn could save the king.
   */
  hasAnyLegalSpawn(
    shopSlots: PieceType[],
    wallet: number,
    color: PieceColor,
    occupiedSquares: Set<SquareName>
  ): boolean {
    const COSTS: Record<PieceType, number> = { p: 1, n: 2, b: 2, r: 3, q: 4, k: 0 }
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']

    for (const type of shopSlots) {
      if (wallet < COSTS[type]) continue

      const ranks: string[] =
        type === 'p'
          ? color === 'w'
            ? ['2', '3', '4']
            : ['5', '6', '7']
          : color === 'w'
            ? ['1', '2', '3', '4']
            : ['5', '6', '7', '8']

      for (const rank of ranks) {
        for (const file of files) {
          const sq = `${file}${rank}` as SquareName
          if (occupiedSquares.has(sq)) continue
          if (this.isLegalPlacement(type, color, sq)) return true
        }
      }
    }
    return false
  }
}

export const chessEngine = new ChessEngine()

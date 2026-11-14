export type ChessFile = 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h'
export type ChessRank = '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8'
export type SquareName = `${ChessFile}${ChessRank}`

export type PieceColor = 'w' | 'b'
export type PieceType = 'p' | 'n' | 'b' | 'r' | 'q' | 'k'

export interface BoardSquareInfo {
  name: SquareName
  fileIndex: number // 0 (a) to 7 (h)
  rankIndex: number // 0 (1) to 7 (8)
  isDark: boolean
  worldPosition: [number, number, number]
}

export interface BoardTheme {
  lightSquareColor: string
  darkSquareColor: string
  lightSquareHover: string
  darkSquareHover: string
  selectedSquareColor: string
  validMoveSquareColor: string
  sandRingColor: string
  woodBorderColor: string
  woodPostColor: string
  ropeColor: string
}

export interface PlacedChessPiece {
  id: string
  square: SquareName
  type: PieceType
  color: PieceColor
}


export type MoveActionType = 'move' | 'deploy' | 'capture' | 'reroll' | 'castle' | 'promotion'

export interface MoveHistoryEntry {
  id: string
  turnNumber: number
  player: PieceColor
  action: MoveActionType
  pieceType?: PieceType
  pieceName: string
  icon: string
  fromSquare?: SquareName
  toSquare: SquareName | '--'
  description: string
  san?: string
  isCheck?: boolean
  isCheckmate?: boolean
  timestamp: number
}

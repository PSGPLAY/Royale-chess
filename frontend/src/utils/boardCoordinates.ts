import type { ChessFile, ChessRank, SquareName, BoardSquareInfo, BoardTheme } from '../types/chess'

export const FILES: ChessFile[] = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
export const RANKS: ChessRank[] = ['1', '2', '3', '4', '5', '6', '7', '8']

export const TILE_SIZE = 1.35
export const TILE_HEIGHT = 0.22
export const BOARD_SIZE = 8 * TILE_SIZE

/**
 * Palette accurately tuned to the pirate dock reference image:
 * Light tiles: Warm bleached sand / cream
 * Dark tiles: Warm sandy brown / tanned wood tone
 */
export const PIRATE_COVE_THEME: BoardTheme = {
  lightSquareColor: '#f0d9b5',
  darkSquareColor: '#8a5a36',
  lightSquareHover: '#fcedd7',
  darkSquareHover: '#9d6840',
  selectedSquareColor: '#4f94e6',
  validMoveSquareColor: '#3875d7',
  sandRingColor: '#e8dcba',
  woodBorderColor: '#4a2d18',
  woodPostColor: '#3d2110',
  ropeColor: '#c7b28b',
}

/**
 * Converts file (0-7) and rank (0-7) to 3D world coordinates [x, y, z].
 * (0,0) is square a1, positioned at [-3.5 * TILE_SIZE, 0, +3.5 * TILE_SIZE].
 */
export function gridToWorld(fileIndex: number, rankIndex: number, yOffset = 0): [number, number, number] {
  const x = (fileIndex - 3.5) * TILE_SIZE
  const z = (3.5 - rankIndex) * TILE_SIZE
  return [x, yOffset, z]
}

/**
 * Converts algebraic notation (e.g., "e4") to 3D world coordinates.
 */
export function squareToWorld(square: SquareName, yOffset = 0): [number, number, number] {
  const file = square[0] as ChessFile
  const rank = square[1] as ChessRank
  const fileIndex = FILES.indexOf(file)
  const rankIndex = RANKS.indexOf(rank)
  return gridToWorld(fileIndex, rankIndex, yOffset)
}

/**
 * Generates metadata for all 64 board squares.
 */
export function generateBoardSquares(): BoardSquareInfo[] {
  const squares: BoardSquareInfo[] = []

  for (let rankIndex = 0; rankIndex < 8; rankIndex++) {
    for (let fileIndex = 0; fileIndex < 8; fileIndex++) {
      const file = FILES[fileIndex]
      const rank = RANKS[rankIndex]
      const name: SquareName = `${file}${rank}`
      // In standard chess, A1 (0,0) is dark.
      // (fileIndex + rankIndex) % 2 === 0 -> dark
      const isDark = (fileIndex + rankIndex) % 2 === 0
      const worldPosition = gridToWorld(fileIndex, rankIndex, 0)

      squares.push({
        name,
        fileIndex,
        rankIndex,
        isDark,
        worldPosition,
      })
    }
  }

  return squares
}

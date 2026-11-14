import type { PlacedChessPiece, ChessFile } from '../types/chess'

/**
 * Generates the official 32 standard starting pieces for a chess match:
 * 16 White pieces (Royal Blue Pirate Crew) on ranks 1 & 2
 * 16 Black pieces (Crimson Red Pirate Crew) on ranks 7 & 8
 */
export function createInitialPieces(): PlacedChessPiece[] {
  const pieces: PlacedChessPiece[] = []
  const files: ChessFile[] = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']

  // 1. White Backrank Officers (Rank 1) - Royal Blue Crew
  pieces.push(
    { id: 'w-r-a1', square: 'a1', type: 'r', color: 'w' },
    { id: 'w-n-b1', square: 'b1', type: 'n', color: 'w' },
    { id: 'w-b-c1', square: 'c1', type: 'b', color: 'w' },
    { id: 'w-q-d1', square: 'd1', type: 'q', color: 'w' },
    { id: 'w-k-e1', square: 'e1', type: 'k', color: 'w' },
    { id: 'w-b-f1', square: 'f1', type: 'b', color: 'w' },
    { id: 'w-n-g1', square: 'g1', type: 'n', color: 'w' },
    { id: 'w-r-h1', square: 'h1', type: 'r', color: 'w' }
  )

  // 2. White Pawns (Rank 2) - 8 Royal Blue Sailors
  files.forEach((file) => {
    pieces.push({
      id: `w-p-${file}2`,
      square: `${file}2`,
      type: 'p',
      color: 'w',
    })
  })

  // 3. Black Backrank Officers (Rank 8) - Crimson Red Crew
  pieces.push(
    { id: 'b-r-a8', square: 'a8', type: 'r', color: 'b' },
    { id: 'b-n-b8', square: 'b8', type: 'n', color: 'b' },
    { id: 'b-b-c8', square: 'c8', type: 'b', color: 'b' },
    { id: 'b-q-d8', square: 'd8', type: 'q', color: 'b' },
    { id: 'b-k-e8', square: 'e8', type: 'k', color: 'b' },
    { id: 'b-b-f8', square: 'f8', type: 'b', color: 'b' },
    { id: 'b-n-g8', square: 'g8', type: 'n', color: 'b' },
    { id: 'b-r-h8', square: 'h8', type: 'r', color: 'b' }
  )

  // 4. Black Pawns (Rank 7) - 8 Crimson Red Sailors
  files.forEach((file) => {
    pieces.push({
      id: `b-p-${file}7`,
      square: `${file}7`,
      type: 'p',
      color: 'b',
    })
  })

  return pieces
}


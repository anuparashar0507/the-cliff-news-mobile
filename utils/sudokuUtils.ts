type SudokuLevel = 'easy' | 'medium' | 'hard';

export function generateSudoku(level: SudokuLevel) {
  // Create a solved puzzle (this is a simplified version)
  const solution = generateSolvedGrid();
  
  // Create an empty grid
  const puzzle = solution.map(row => [...row]);
  const fixed = solution.map(row => row.map(() => false));
  
  // Determine how many cells to reveal based on difficulty
  let cellsToReveal;
  if (level === 'easy') {
    cellsToReveal = 40; // More cells revealed = easier
  } else if (level === 'medium') {
    cellsToReveal = 30;
  } else {
    cellsToReveal = 25; // Fewer cells revealed = harder
  }
  
  // Remove numbers from the puzzle to create the game
  const totalCells = 81;
  const cellsToRemove = totalCells - cellsToReveal;
  
  for (let i = 0; i < cellsToRemove; i++) {
    let row, col;
    do {
      row = Math.floor(Math.random() * 9);
      col = Math.floor(Math.random() * 9);
    } while (puzzle[row][col] === 0);
    
    puzzle[row][col] = 0;
  }
  
  // Mark the fixed cells
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (puzzle[row][col] !== 0) {
        fixed[row][col] = true;
      }
    }
  }
  
  return { puzzle, solution, fixed };
}

export function checkSolution(grid: number[][]): boolean {
  // Check if the grid is completely filled
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (grid[row][col] === 0) {
        return false;
      }
    }
  }
  
  // Check all rows
  for (let row = 0; row < 9; row++) {
    const rowSet = new Set();
    for (let col = 0; col < 9; col++) {
      rowSet.add(grid[row][col]);
    }
    if (rowSet.size !== 9) return false;
  }
  
  // Check all columns
  for (let col = 0; col < 9; col++) {
    const colSet = new Set();
    for (let row = 0; row < 9; row++) {
      colSet.add(grid[row][col]);
    }
    if (colSet.size !== 9) return false;
  }
  
  // Check all 3x3 boxes
  for (let boxRow = 0; boxRow < 3; boxRow++) {
    for (let boxCol = 0; boxCol < 3; boxCol++) {
      const boxSet = new Set();
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          boxSet.add(grid[3 * boxRow + i][3 * boxCol + j]);
        }
      }
      if (boxSet.size !== 9) return false;
    }
  }
  
  return true;
}

// Helper function to generate a solved Sudoku grid
function generateSolvedGrid(): number[][] {
  // This is a pre-defined valid Sudoku solution
  // In a real app, you'd use a better algorithm to generate random valid solutions
  return [
    [5, 3, 4, 6, 7, 8, 9, 1, 2],
    [6, 7, 2, 1, 9, 5, 3, 4, 8],
    [1, 9, 8, 3, 4, 2, 5, 6, 7],
    [8, 5, 9, 7, 6, 1, 4, 2, 3],
    [4, 2, 6, 8, 5, 3, 7, 9, 1],
    [7, 1, 3, 9, 2, 4, 8, 5, 6],
    [9, 6, 1, 5, 3, 7, 2, 8, 4],
    [2, 8, 7, 4, 1, 9, 6, 3, 5],
    [3, 4, 5, 2, 8, 6, 1, 7, 9]
  ];
}
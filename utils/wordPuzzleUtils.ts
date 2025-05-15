// Types for the word puzzle game
export interface WordPuzzleData {
  grid: string[][];
  words: string[];
}

// Common word list to select from
const wordList = [
  'news', 'media', 'paper', 'report', 'story',
  'headline', 'article', 'press', 'editor', 'column',
  'journalist', 'source', 'cliff', 'reader', 'daily',
  'weekly', 'content', 'local', 'global', 'interview',
  'feature', 'breaking', 'current', 'events', 'politics',
  'sports', 'weather', 'opinion', 'editorial', 'publish'
];

// Generate the word puzzle based on difficulty
export function generateWordPuzzle(difficulty: 'easy' | 'medium' | 'hard'): WordPuzzleData {
  // Determine grid size and number of words based on difficulty
  let gridSize: number;
  let numWords: number;
  
  switch (difficulty) {
    case 'easy':
      gridSize = 8;
      numWords = 5;
      break;
    case 'medium':
      gridSize = 10;
      numWords = 8;
      break;
    case 'hard':
      gridSize = 12;
      numWords = 10;
      break;
  }
  
  // Select random words from the word list
  const selectedWords = selectRandomWords(numWords);
  
  // Create an empty grid
  const grid = createEmptyGrid(gridSize);
  
  // Place words in the grid
  placeWordsInGrid(grid, selectedWords, difficulty);
  
  // Fill remaining empty cells with random letters
  fillEmptyCells(grid);
  
  return {
    grid,
    words: selectedWords
  };
}

// Helper function to select random words from the word list
function selectRandomWords(numWords: number): string[] {
  const words: string[] = [];
  const shuffledList = [...wordList].sort(() => 0.5 - Math.random());
  
  for (let i = 0; i < numWords && i < shuffledList.length; i++) {
    words.push(shuffledList[i].toLowerCase());
  }
  
  return words;
}

// Create an empty grid filled with empty strings
function createEmptyGrid(size: number): string[][] {
  const grid: string[][] = [];
  
  for (let i = 0; i < size; i++) {
    grid.push(new Array(size).fill(''));
  }
  
  return grid;
}

// Place words in the grid based on difficulty
function placeWordsInGrid(grid: string[][], words: string[], difficulty: 'easy' | 'medium' | 'hard'): void {
  const directions = getDirectionsForDifficulty(difficulty);
  
  for (const word of words) {
    let placed = false;
    let attempts = 0;
    const maxAttempts = 100;
    
    while (!placed && attempts < maxAttempts) {
      attempts++;
      
      // Pick a random direction
      const direction = directions[Math.floor(Math.random() * directions.length)];
      
      // Try to place the word
      placed = tryPlaceWord(grid, word, direction);
    }
    
    // If we couldn't place the word after max attempts, we might want to
    // reduce the grid size or number of words, but for simplicity, we'll just continue
  }
}

// Get allowed directions based on difficulty
function getDirectionsForDifficulty(difficulty: 'easy' | 'medium' | 'hard'): string[] {
  switch (difficulty) {
    case 'easy':
      // Only horizontal and vertical
      return ['right', 'down'];
    case 'medium':
      // Horizontal, vertical, and diagonal down
      return ['right', 'down', 'down-right'];
    case 'hard':
      // All directions including backwards
      return ['right', 'down', 'down-right', 'down-left', 'left', 'up', 'up-right', 'up-left'];
  }
}

// Try to place a word in the grid in a given direction
function tryPlaceWord(grid: string[][], word: string, direction: string): boolean {
  const size = grid.length;
  
  // Calculate max starting positions based on direction
  let maxRow = size - 1;
  let maxCol = size - 1;
  
  if (direction.includes('down')) {
    maxRow = size - word.length;
  }
  if (direction.includes('up')) {
    maxRow = word.length - 1;
  }
  if (direction.includes('right')) {
    maxCol = size - word.length;
  }
  if (direction.includes('left')) {
    maxCol = word.length - 1;
  }
  
  // Pick random starting position
  const startRow = Math.floor(Math.random() * (maxRow + 1));
  const startCol = Math.floor(Math.random() * (maxCol + 1));
  
  // Calculate direction offsets
  let rowOffset = 0;
  let colOffset = 0;
  
  if (direction.includes('down')) rowOffset = 1;
  if (direction.includes('up')) rowOffset = -1;
  if (direction.includes('right')) colOffset = 1;
  if (direction.includes('left')) colOffset = -1;
  
  // Check if the word can be placed
  for (let i = 0; i < word.length; i++) {
    const row = startRow + i * rowOffset;
    const col = startCol + i * colOffset;
    
    if (grid[row][col] !== '' && grid[row][col] !== word[i]) {
      return false; // Cell is occupied by a different letter
    }
  }
  
  // Place the word
  for (let i = 0; i < word.length; i++) {
    const row = startRow + i * rowOffset;
    const col = startCol + i * colOffset;
    grid[row][col] = word[i];
  }
  
  return true;
}

// Fill empty cells with random letters
function fillEmptyCells(grid: string[][]): void {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz';
  
  for (let i = 0; i < grid.length; i++) {
    for (let j = 0; j < grid[i].length; j++) {
      if (grid[i][j] === '') {
        const randomIndex = Math.floor(Math.random() * alphabet.length);
        grid[i][j] = alphabet[randomIndex];
      }
    }
  }
}
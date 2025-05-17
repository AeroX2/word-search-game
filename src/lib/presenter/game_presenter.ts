import { gameStore } from '../stores/game_store';
import type { Word, Coord } from '../generator/word_grid_generator';
import { generateWordGrid, Grid } from '../generator/word_grid_generator';
import type { Writable } from 'svelte/store';

type CellState = {
    selected: boolean;
    completed: boolean;
    color?: string;
};

type GameState = {
    wordCount: number;
    grid: Grid | null;
    words: Array<Word & { completed: boolean; color?: string }>;
    cells: Map<string, CellState>;
    isDragging: boolean;
    selectionOrder: Coord[];
    isStarting: boolean;
    timeoutId: number | null;
};

function getRandomChar(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    return chars[Math.floor(Math.random() * chars.length)];
}

function getRandomColor() {
    const hue = Math.floor(Math.random() * 360);
    return `hsl(${hue}, 70%, 60%)`;
}

function isAdjacent(x1: number, y1: number, x2: number, y2: number): boolean {
    const dx = Math.abs(x1 - x2);
    const dy = Math.abs(y1 - y2);
    return dx <= 1 && dy <= 1 && !(dx === 0 && dy === 0);
}

export class GamePresenter {
    private store: Writable<GameState>;

    constructor(store: Writable<GameState>) {
        this.store = store;
    }

    generateGrid(wordCount: number) {
        const result = generateWordGrid(wordCount);
        
        // Fill empty cells with random characters
        const grid = result.grid;
        for (let y = grid.minY; y <= grid.maxY; y++) {
            for (let x = grid.minX; x <= grid.maxX; x++) {
                if (!grid.getChar(x, y)) {
                    grid.addChar(x, y, getRandomChar());
                }
            }
        }

        this.store.set({
            wordCount,
            grid: result.grid,
            words: result.words.map(word => ({
                ...word,
                completed: false
            })),
            cells: new Map(),
            isDragging: false,
            selectionOrder: [],
            isStarting: true,
            timeoutId: null
        });

        this.store.update((state: GameState) => {
            if (state.timeoutId !== null) {
                clearTimeout(state.timeoutId);
            }
            return state;
        });

        const timeoutId = setTimeout(() => {
            this.store.update((state: GameState) => ({
                ...state,
                isStarting: false,
                timeoutId: null
            }));
        }, 2000);

        this.store.update((state: GameState) => ({
            ...state,
            timeoutId
        }));
    }

    toggleCell(x: number, y: number) {
        this.store.update((state: GameState) => {
            if (!state.grid) return state;

            const key = `${x},${y}`;
            const currentCell = state.cells.get(key) ?? { selected: false, completed: false };

            // If there's a last selected cell, check if the new cell is adjacent
            const lastSelectedCell = state.selectionOrder[state.selectionOrder.length - 1];
            if (!currentCell.selected && lastSelectedCell && !isAdjacent(x, y, lastSelectedCell.x, lastSelectedCell.y)) {
                // Reset all cells to unselected
                const newCells = new Map(state.cells);
                Array.from(newCells.entries()).forEach(([k, v]) => {
                    newCells.set(k, { ...v, selected: false });
                });

                // Set the new cell to selected
                newCells.set(`${x},${y}`, { selected: true, completed: false });
                
                return {
                    ...state,
                    cells: newCells,
                    selectionOrder: [{ x, y }]
                };
            }

            const firstCoord = state.selectionOrder[0];
            const lastCoord = state.selectionOrder[state.selectionOrder.length - 1];
            const isFirstOrLast = (firstCoord?.x === x && firstCoord?.y === y) || 
                                (lastCoord?.x === x && lastCoord?.y === y);

            if (currentCell.selected && isFirstOrLast) {
                state.cells.set(key, { ...currentCell, selected: false });
                state.selectionOrder = state.selectionOrder.filter(coord => coord.x !== x || coord.y !== y);
            } else if (!currentCell.selected) {
                state.cells.set(key, { ...currentCell, selected: true });
                state.selectionOrder = [...state.selectionOrder, { x, y }];
            }

            return this.checkForCompletedWords(state);
        });
    }

    setDragging(isDragging: boolean) {
        this.store.update((state: GameState) => ({ ...state, isDragging }));
    }

    completeWord(word: Word & { completed: boolean; color?: string }) {
        if (word.completed) return;
        
        const color = getRandomColor();
        this.store.update((state: GameState) => {
            const newState = { ...state };
            const wordIndex = newState.words.findIndex(w => w.text === word.text);
            if (wordIndex !== -1) {
                newState.words[wordIndex] = { ...word, completed: true, color };
                word.coords.forEach(coord => {
                    const key = `${coord.x},${coord.y}`;
                    const cell = newState.cells.get(key) ?? { selected: false, completed: false };
                    newState.cells.set(key, { ...cell, selected: false, completed: true, color });
                });
            }
            return newState;
        });
    }

    triggerWin() {
        document.body.classList.add('game-complete');
        setTimeout(() => {
            document.body.classList.remove('game-complete');
            this.store.update((state: GameState) => {
                const result = generateWordGrid(state.wordCount);
                return {
                    ...state,
                    grid: result.grid,
                    words: result.words.map(word => ({
                        ...word,
                        completed: false
                    })),
                    cells: new Map(),
                    isDragging: false,
                    selectionOrder: [],
                    isStarting: true,
                    timeoutId: null
                };
            });
        }, 2000);
    }

    private checkForCompletedWords(state: GameState): GameState {
        const selectedCoordsNonComplete = state.selectionOrder.filter(coord => !state.cells.get(`${coord.x},${coord.y}`)?.completed);
        const nonCompletedWords = state.words.filter(word => !word.completed);

        for (const word of nonCompletedWords) {
            const allCoordsSelected = word.coords.every((coord, index) => {
                const selectedCoord = selectedCoordsNonComplete[index];
                return selectedCoord && selectedCoord.x === coord.x && selectedCoord.y === coord.y;
            });

            if (allCoordsSelected) {
                const wordIndex = state.words.findIndex(w => w.text === word.text);
                if (wordIndex !== -1) {
                    state.words[wordIndex] = { ...word, completed: true };
                    word.coords.forEach(coord => {
                        const key = `${coord.x},${coord.y}`;
                        const cell = state.cells.get(key) ?? { selected: false, completed: false };
                        state.cells.set(key, { ...cell, selected: false, completed: true });
                    });
                }
                state.selectionOrder = [];
                state.isDragging = false;

                // Check if all words are completed
                if (state.words.every(w => w.completed)) {
                    this.triggerWin();
                }
                break;
            }
        }

        return state;
    }
}

export const gamePresenter = new GamePresenter(gameStore); 
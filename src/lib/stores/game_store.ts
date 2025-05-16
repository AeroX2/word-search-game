import { writable } from 'svelte/store';
import type { Word, Coord } from '../generator/word_grid_generator';
import { generateWordGrid, Grid } from '../generator/word_grid_generator';

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

function createGameStore() {
    const { subscribe, set, update } = writable<GameState>({
        wordCount: 10,
        grid: null,
        words: [],
        cells: new Map(),
        isDragging: false,
        selectionOrder: [],
        isStarting: false,
        timeoutId: null
    });

    return {
        subscribe,
        generateGrid: (wordCount: number) => {
            const result = generateWordGrid(wordCount);
            const grid = result.grid.normalize();
            
            // Normalize all word coordinates at once
            const normalizedWords = result.grid.normalizeWords(result.words).map(word => ({
                ...word,
                completed: false
            }));

            set({
                wordCount,
                grid,
                words: normalizedWords,
                cells: new Map(),
                isDragging: false,
                selectionOrder: [],
                isStarting: true,
                timeoutId: null
            });

            update(state => {
                if (state.timeoutId !== null) {
                    clearTimeout(state.timeoutId);
                }
                return {
                    ...state,
                };
            });
            const timeoutId = setTimeout(() => {
                update(state => ({
                    ...state,
                    isStarting: false,
                    timeoutId: null
                }));
            }, 2000);

            update(state => ({
                ...state,
                timeoutId
            }));
        },
        toggleCell: (x: number, y: number) => {
            update(state => {
                if (!state.grid) return state;

                const key = `${x},${y}`;
                const currentCell = state.cells.get(key) ?? { selected: false, completed: false };

                // If there's a last selected cell, check if the new cell is adjacent
                const lastSelectedCell = state.selectionOrder[state.selectionOrder.length - 1];
                if (!currentCell.selected && lastSelectedCell && !isAdjacent(x, y, lastSelectedCell.x, lastSelectedCell.y)) {
                    return {
                        ...state,
                        // Reset all cells to unselected
                        cells: new Map(Array.from(state.cells.entries()).map(([k, v]) => [k, { ...v, selected: false }])),
                        selectionOrder: []
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

                return checkForCompletedWords(state);
            });
        },
        setDragging: (isDragging: boolean) => {
            update(state => ({ ...state, isDragging }));
        },
        completeWord: (word: Word & { completed: boolean; color?: string }) => {
            if (word.completed) return;
            
            const color = getRandomColor();
            update(state => {
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
    };
}

function isAdjacent(x1: number, y1: number, x2: number, y2: number): boolean {
    const dx = Math.abs(x1 - x2);
    const dy = Math.abs(y1 - y2);
    return dx <= 1 && dy <= 1 && !(dx === 0 && dy === 0);
}

function getRandomColor() {
    const hue = Math.floor(Math.random() * 360);
    return `hsl(${hue}, 70%, 60%)`;
}

function checkForCompletedWords(state: GameState): GameState {
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
                document.body.classList.add('game-complete');
                setTimeout(() => {
                    document.body.classList.remove('game-complete');
                    gameStore.generateGrid(state.wordCount);
                }, 2000);
            }
            break;
        }
    }

    return state;
}

export const gameStore = createGameStore(); 
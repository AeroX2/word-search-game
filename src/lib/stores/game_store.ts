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

const initialState: GameState = {
    wordCount: 10,
    grid: null,
    words: [],
    cells: new Map(),
    isDragging: false,
    selectionOrder: [],
    isStarting: false,
    timeoutId: null
};

export const gameStore = writable<GameState>(initialState);
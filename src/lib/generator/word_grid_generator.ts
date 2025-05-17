import Rand from "rand-seed";
import word_list from "../../assets/word_list.json";

enum Direction {
    UP,
    DOWN,
    LEFT,
    RIGHT,
}

const DIRECTIONS = [Direction.UP, Direction.DOWN, Direction.LEFT, Direction.RIGHT];
const ATTACH_CHANCE = 0.7;  // Chance to attach to existing word
const EDGE_BUFFER = 0.2;    // Minimum distance from edges in percentage of grid size
const ASPECT_RATIO_WIDE = 1.2;
const ASPECT_RATIO_NARROW = 0.8;

const prng = new Rand("1234567890");

export type Coord = {
    x: number;
    y: number;
}

type CellInfo = {
    char: string;
    direction: Direction | undefined;
}

export type Word = {
    text: string;
    coords: Coord[];
}

export class Grid {
    private grid: Map<string, CellInfo>;
    minX: number = 0;
    maxX: number = 0;
    minY: number = 0;
    maxY: number = 0;

    constructor() {
        this.grid = new Map<string, CellInfo>();
    }
    
    private coordToKey(x: number, y: number): string {
        return `${x},${y}`;
    }
    
    addChar(x: number, y: number, char: string, direction?: Direction) {
        this.minX = Math.min(this.minX, x);
        this.maxX = Math.max(this.maxX, x);
        this.minY = Math.min(this.minY, y);
        this.maxY = Math.max(this.maxY, y);

        const key = this.coordToKey(x, y);
        const existingCell = this.grid.get(key);
        if (existingCell) {
            return false;
        }

        this.grid.set(key, { char, direction });
        return true;
    }

    getChar(x: number, y: number): string | undefined {
        return this.grid.get(this.coordToKey(x, y))?.char;
    }

    getCellInfo(x: number, y: number): CellInfo | undefined {
        return this.grid.get(this.coordToKey(x, y));
    }

    normalize(): Grid {
        const newGrid = new Grid();
        for (const coord of this.coords) {
            const cellInfo = this.grid.get(this.coordToKey(coord.x, coord.y))!;
            newGrid.addChar(coord.x - this.minX, coord.y - this.minY, cellInfo.char, cellInfo.direction!);
        }
        return newGrid;
    }

    normalizeWords(words: Word[]): Word[] {
        return words.map(word => ({
            ...word,
            coords: word.coords.map(coord => ({
                x: coord.x - this.minX,
                y: coord.y - this.minY
            }))
        }));
    }

    print() {
        for (let y = this.minY; y <= this.maxY; y++) {
            let s = '';
            for (let x = this.minX; x <= this.maxX; x++) {
                const char = this.getChar(x, y);
                s += char || " ";
            }
            console.log(s);
        }
    }

    get coords(): Coord[] {
        return Array.from(this.grid.keys()).map(key => {
            const [x, y] = key.split(',').map(Number);
            return { x, y };
        });
    }

    get width() {
        return this.maxX - this.minX + 1;
    }

    get height() {
        return this.maxY - this.minY + 1;
    }
}

function randInt(min: number, max: number) {
    return Math.floor(prng.next() * (max - min + 1)) + min;
}

function randWord() {
    return word_list[randInt(0, word_list.length - 1)];
}

function randDirection() {
    return DIRECTIONS[randInt(0, DIRECTIONS.length - 1)];
}

function isHorizontal(direction: Direction): boolean {
    return direction === Direction.LEFT || direction === Direction.RIGHT;
}

function getPerpendicularDirections(direction: Direction): Direction[] {
    return isHorizontal(direction) 
        ? [Direction.UP, Direction.DOWN]
        : [Direction.LEFT, Direction.RIGHT];
}

function addWordToGrid(
    grid: Grid,
    word: string,
    direction: Direction,
    x: number,
    y: number
): Word {
    const coords: Coord[] = [];
    let i = 0;

    while (i < word.length) {
        const px = x;
        const py = y;

        const success = grid.addChar(x, y, word[i], direction);
        
        switch (direction) {
            case Direction.UP:
                y--;
                break;
            case Direction.DOWN:
                y++;
                break;
            case Direction.LEFT:
                x--;
                break;
            case Direction.RIGHT:
                x++;
                break;
        }

        if (!success) {
            // If we couldn't add the character, try again at the new position
            continue;
        }

        // Store the successful coordinate
        coords.push({ x: px, y: py });
        i++;
    }

    return { text: word, coords };
}

function getRandomChar(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    return chars[Math.floor(Math.random() * chars.length)];
}

function fillEmptyCells(grid: Grid) {
    for (let y = grid.minY; y <= grid.maxY; y++) {
        for (let x = grid.minX; x <= grid.maxX; x++) {
            if (!grid.getChar(x, y)) {
                grid.addChar(x, y, getRandomChar());
            }
        }
    }
}

export function generateWordGrid(amount: number): { grid: Grid; words: Word[] } {
    const grid = new Grid();
    const words: Word[] = [];
    
    const startingWord = randWord();
    const startingDirection = randDirection();
    words.push(addWordToGrid(grid, startingWord, startingDirection, 0, 0));

    for (let i = 0; i < amount; i++) {
        const randomWord = randWord();
        const shouldAttach = prng.next() < ATTACH_CHANCE;

        if (shouldAttach && grid.coords.length > 0) {
            const randomPoint = grid.coords[randInt(0, grid.coords.length - 1)];
            const cellInfo = grid.getCellInfo(randomPoint.x, randomPoint.y);
            
            // If the cell has a word, prefer perpendicular direction
            let randomDirection: Direction;
            if (cellInfo?.direction !== null) {
                const perpendicularDirections = getPerpendicularDirections(cellInfo!.direction!);
                randomDirection = perpendicularDirections[randInt(0, 1)];
            } else {
                randomDirection = randDirection();
            }
            
            // Fuzz the position based on direction and word length
            let fuzzedX = randomPoint.x;
            let fuzzedY = randomPoint.y;
            const fuzzAmount = Math.floor(randomWord.length / 2);
            
            if (isHorizontal(randomDirection)) {
                fuzzedY += randInt(-fuzzAmount, fuzzAmount);
            } else {
                fuzzedX += randInt(-fuzzAmount, fuzzAmount);
            }
            
            words.push(addWordToGrid(grid, randomWord, randomDirection, fuzzedX, fuzzedY));
            continue;
        }

        const currentWidth = grid.width;
        const currentHeight = grid.height;
        const aspectRatio = currentWidth / currentHeight;

        // Calculate safe boundaries for word placement
        const minX = grid.minX + Math.floor(grid.width * EDGE_BUFFER);
        const maxX = grid.maxX - Math.floor(grid.width * EDGE_BUFFER);
        const minY = grid.minY + Math.floor(grid.height * EDGE_BUFFER);
        const maxY = grid.maxY - Math.floor(grid.height * EDGE_BUFFER);

        let preferredX = grid.minX;
        let preferredY = grid.minY;
        
        if (aspectRatio > ASPECT_RATIO_WIDE) {
            // Grid is too wide, prefer vertical placement
            preferredX = randInt(minX, maxX);
            preferredY = randInt(minY, maxY);
        } else if (aspectRatio < ASPECT_RATIO_NARROW) {
            // Grid is too tall, prefer horizontal placement
            preferredX = randInt(minX, maxX);
            preferredY = randInt(minY, maxY);
        } else {
            // Grid is roughly square, allow any placement
            preferredX = randInt(minX, maxX);
            preferredY = randInt(minY, maxY);
        }

        const randomDirection = randDirection();
        words.push(addWordToGrid(grid, randomWord, randomDirection, preferredX, preferredY));
    }

    // Fill empty cells with random characters
    fillEmptyCells(grid);

    // Rotate the grid if height > width
    const normalizedGrid = grid.normalize();
    const normalizedWords = grid.normalizeWords(words);
    if (normalizedGrid.height > normalizedGrid.width) {
        const rotatedGrid = new Grid();
        const rotatedWords: Word[] = [];

        // Rotate each cell and word
        for (const coord of normalizedGrid.coords) {
            const cellInfo = normalizedGrid.getCellInfo(coord.x, coord.y)!;
            rotatedGrid.addChar(
                coord.y,
                normalizedGrid.width - 1 - coord.x,
                cellInfo.char,
                cellInfo.direction!
            );
        }

        // Rotate word coordinates
        for (const word of normalizedWords) {
            const rotatedCoords = word.coords.map(coord => ({
                x: coord.y,
                y: normalizedGrid.width - 1 - coord.x
            }));
            rotatedWords.push({
                text: word.text,
                coords: rotatedCoords
            });
        }
        return { grid: rotatedGrid, words: rotatedWords };
    }

    return { grid: normalizedGrid, words: normalizedWords };
}

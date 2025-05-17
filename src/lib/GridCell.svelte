<script lang="ts">
    import type { Grid } from './generator/word_grid_generator';

    let { 
        grid,
        x,
        y,
        selected = false,
        completed = false,
        starting = true,
        color,
        onMouseDown,
        onMouseEnter,
        style = ''
    } = $props<{
        grid: Grid;
        x: number;
        y: number;
        selected?: boolean;
        completed?: boolean;
        starting?: boolean;
        color?: string;
        onMouseDown: (x: number, y: number, event: MouseEvent) => void;
        onMouseEnter: (x: number, y: number) => void;
        style?: string;
    }>();
</script>

<div 
    class="grid-cell" 
    class:selected
    class:completed
    class:starting
    style={color ? `background-color: ${color}; ${style}` : style}
    onmousedown={(e) => onMouseDown(x, y, e)}
    onmouseenter={() => onMouseEnter(x, y)}
    onkeydown={(e) => e.key === 'Enter' && onMouseDown(x, y, e as unknown as MouseEvent)}
    role="button"
    tabindex="0"
>
    <span class="cell-text">{grid.getChar(x, y)}</span>
</div>

<style>
    @keyframes dropIn {
        0% {
            opacity: 0;
            transform: scale(0.5) rotate(var(--start-rotate, -15deg));
        }
        70% {
            opacity: 1;
            transform: scale(1.1) rotate(var(--mid-rotate, 5deg));
        }
        100% {
            opacity: 1;
            transform: scale(1) rotate(0deg);
        }
    }
    @keyframes celebrate {
        0% { transform: scale(1) rotate(0deg); }
        25% { transform: scale(1.2) rotate(5deg); }
        50% { transform: scale(1) rotate(0deg); }
        75% { transform: scale(1.2) rotate(-5deg); }
        100% { transform: scale(1) rotate(0deg); }
    }

    @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.1); }
        100% { transform: scale(1); }
    }

    @keyframes complete {
        0% { transform: scale(1); }
        50% { transform: scale(1.15); }
        100% { transform: scale(1); }
    }

    .grid-cell {
        aspect-ratio: 1;
        border: 0.5px solid #ccc;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: min(1.2em, 5vw);
        text-transform: uppercase;
        min-width: 0;
        min-height: 0;
        cursor: pointer;
    }

    .grid-cell.starting .cell-text {
        opacity: 0;
        animation: dropIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        animation-delay: calc(var(--delay) * 1s);
    }

    .grid-cell:hover {
        background-color: rgba(255, 255, 255, 0.1);
    }

    .grid-cell.selected {
        background-color: rgba(100, 108, 255, 0.3);
    }

    .grid-cell.selected .cell-text {
        animation: pulse 0.3s ease-in-out;
    }

    .grid-cell.completed {
        animation: complete 0.5s ease-out;
        background-color: rgba(100, 255, 100, 0.3);
        cursor: default;
    }

    :global(.game-complete) .grid-cell {
        animation: celebrate 1s ease-in-out infinite;
        animation-delay: calc(var(--delay) * 0.5s);
    }
</style> 
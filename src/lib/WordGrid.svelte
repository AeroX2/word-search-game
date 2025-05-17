<script lang="ts">
    import { gameStore } from './stores/game_store';
    import { gamePresenter } from './presenter/game_presenter';
    import WordList from "./WordList.svelte";
    import DevTools from "./DevTools.svelte";
    import GridCell from "./GridCell.svelte";
    import { onMount } from 'svelte';

    let sliderValue = $state(20);

    function handleMouseDown(x: number, y: number, event: MouseEvent) {
        event.preventDefault();
        gamePresenter.setDragging(true);
        gamePresenter.toggleCell(x, y);
    }

    function handleMouseEnter(x: number, y: number) {
        if ($gameStore.isDragging) {
            gamePresenter.toggleCell(x, y);
        }
    }

    function handleMouseUp() {
        gamePresenter.setDragging(false);
    }

    function completeRandomWord() {
        const incompleteWords = $gameStore.words.filter(w => !w.completed);
        if (incompleteWords.length > 0) {
            const randomIndex = Math.floor(Math.random() * incompleteWords.length);
            gamePresenter.completeWord(incompleteWords[randomIndex]);
        }
    }

    function completeAllWords() {
        $gameStore.words.forEach(word => gamePresenter.completeWord(word));
        gamePresenter.triggerWin();
    }

    onMount(() => {
        gamePresenter.generateGrid(sliderValue);
    });
</script>

<svelte:window onmouseup={handleMouseUp} />

<h1>Word Grid</h1>
<div class="controls">
    <div class="word-count-control">
        <label for="wordCount">Number of Words: {sliderValue}</label>
        <input 
            type="range" 
            id="wordCount" 
            min="5" 
            max="50" 
            bind:value={sliderValue}
        />
    </div>
    <button onclick={() => gamePresenter.generateGrid(sliderValue)}>New Game</button>
</div>

{#if $gameStore.grid}
    <div class="grid-container" class:generating={!$gameStore.grid} style="--cols: {$gameStore.grid.width}">
        {#each Array($gameStore.grid.height) as _, y}
            {#each Array($gameStore.grid.width) as _, x}
                {@const key = `${x},${y}`}
                {@const cell = $gameStore.cells.get(key)}
                {@const delay = ((x * 31 + y * 17) % 20) / 20}
                {@const startRotate = ((x * 13 + y * 7) % 30) - 15}
                {@const midRotate = ((x * 17 + y * 11) % 20) - 10}
                <GridCell
                    grid={$gameStore.grid}
                    {x}
                    {y}
                    selected={cell?.selected ?? false}
                    completed={cell?.completed ?? false}
                    starting={$gameStore.isStarting}
                    color={cell?.color}
                    onMouseDown={handleMouseDown}
                    onMouseEnter={handleMouseEnter}
                    style="--delay: {delay}; --start-rotate: {startRotate}deg; --mid-rotate: {midRotate}deg"
                />
            {/each}
        {/each}
    </div>

    <WordList words={$gameStore.words} />
    <DevTools 
        completeRandomWord={completeRandomWord}
        completeAllWords={completeAllWords}
    />
{/if}

<style>
    @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.1); }
        100% { transform: scale(1); }
    }

    @keyframes complete {
        0% { transform: scale(1); }
        50% { transform: scale(1.2); background-color: rgba(100, 255, 100, 0.5); }
        100% { transform: scale(1); }
    }

    @keyframes fadeIn {
        from { opacity: 0; transform: scale(0.9); }
        to { opacity: 1; transform: scale(1); }
    }
    .grid-container {
        display: grid;
        margin: 20px 0;
        width: min(100vw - 40px, 800px);
        margin-left: auto;
        margin-right: auto;
        grid-template-columns: repeat(var(--cols, 10), minmax(0, 1fr));
        user-select: none;
        -webkit-user-select: none;
    }
    .grid-container.generating {
        animation: fadeIn 0.5s ease-out;
    }
    .controls {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
        margin-bottom: 1rem;
    }
    .word-count-control {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
    }
    input[type="range"] {
        width: 200px;
    }
</style>
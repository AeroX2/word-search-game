<script lang="ts">
    type Word = { text: string, completed: boolean, color?: string };
    const { words } = $props<{ words: Word[] }>();
    
    let showWords = $state(false);
    let windowPosition = $state({ x: 20, y: 20 });
    let isDragging = $state(false);
    let dragOffset = $state({ x: 0, y: 0 });

    function handleMouseDown(event: MouseEvent) {
        const header = event.target as HTMLElement;
        if (!header.closest('.word-list-header')) return;

        isDragging = true;
        const rect = header.getBoundingClientRect();
        dragOffset = {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
        };
    }

    function handleMouseMove(event: MouseEvent) {
        if (!isDragging) return;

        windowPosition = {
            x: event.clientX - dragOffset.x,
            y: event.clientY - dragOffset.y
        };
    }

    function handleMouseUp() {
        isDragging = false;
    }
</script>

<svelte:window onmousemove={handleMouseMove} onmouseup={handleMouseUp} />

<button class="word-list-toggle" onclick={() => showWords = !showWords}>
    {showWords ? 'Hide Words' : 'Show Words'}
</button>

{#if showWords}
    <div 
        class="word-list-window" 
        style="left: {windowPosition.x}px; top: {windowPosition.y}px;"
        onmousedown={handleMouseDown}
        role="dialog"
        aria-label="Word List"
        tabindex="0"
    >
        <div class="word-list-header">
            <h3>Word List</h3>
            <button class="close-button" onclick={(e) => { e.stopPropagation(); showWords = false; }}>×</button>
        </div>
        <div class="words">
            {#each words as word}
                <div 
                    class="word" 
                    class:completed={word.completed}
                    style={word.color ? `border-color: ${word.color}; color: ${word.color}` : ''}
                >
                    {word.text}
                    {#if word.completed}
                        <span class="checkmark" style={word.color ? `color: ${word.color}` : ''}>✓</span>
                    {/if}
                </div>
            {/each}
        </div>
    </div>
{/if}

<style>

    @keyframes slideIn {
        from { transform: translateY(20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
    }

    @keyframes wordComplete {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); background-color: rgba(100, 255, 100, 0.2); }
        100% { transform: scale(1); }
    }

    @keyframes checkmarkPop {
        0% { transform: scale(0); }
        50% { transform: scale(1.2); }
        100% { transform: scale(1); }
    }

    @keyframes wordCelebrate {
        0% { transform: translateY(0) scale(1); }
        50% { transform: translateY(-5px) scale(1.1); }
        100% { transform: translateY(0) scale(1); }
    }

    .word-list-toggle {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 10px 20px;
        border: 1px solid #ccc;
        border-radius: 4px;
        cursor: pointer;
        transition: border-color 0.2s;
        z-index: 100;
    }

    .word-list-toggle:hover {
        border-color: #646cff;
    }

    .word-list-window {
        position: fixed;
        width: min(400px, calc(100vw - 40px));
        max-height: 60vh;
        border: 1px solid #ccc;
        border-radius: 8px;
        background-color: #242424;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        z-index: 100;
        display: flex;
        flex-direction: column;
        animation: slideIn 0.3s ease-out;
    }

    .word-list-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px 15px;
        border-bottom: 1px solid #ccc;
        cursor: move;
        user-select: none;
    }

    .word-list-header h3 {
        margin: 0;
        font-size: 1.2em;
    }

    .close-button {
        background: none;
        border: none;
        font-size: 1.5em;
        cursor: pointer;
        padding: 0 5px;
        color: inherit;
        transition: color 0.2s;
    }

    .close-button:hover {
        color: #646cff;
    }

    .words {
        padding: 15px;
        overflow-y: auto;
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
        gap: 10px;
    }

    .word {
        padding: 5px 10px;
        border: 1px solid #ccc;
        border-radius: 4px;
        text-align: center;
        display: flex;
        justify-content: space-between;
        align-items: center;
        transition: all 0.3s ease-out;
    }

    .word.completed {
        opacity: 0.7;
        text-decoration: line-through;
        animation: wordComplete 1s ease-out;
    }

    .checkmark {
        color: #646cff;
        margin-left: 5px;
        animation: checkmarkPop 1s ease-out;
    }

    :global(.game-complete) .word {
        animation: wordCelebrate 0.5s ease-out infinite;
    }

    :global(.game-complete) .word:nth-child(2n) {
        animation-delay: 0.1s;
    }

    :global(.game-complete) .word:nth-child(3n) {
        animation-delay: 0.2s;
    }

    :global(.game-complete) .word:nth-child(4n) {
        animation-delay: 0.3s;
    }
</style> 
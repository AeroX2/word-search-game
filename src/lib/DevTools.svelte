<script lang="ts">
    const { completeRandomWord, completeAllWords } = $props<{
        completeRandomWord: () => void;
        completeAllWords: () => void;
    }>();
    
    let konamiSequence = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
    let currentSequence = $state<string[]>([]);
    let showDevTools = $state(false);

    function handleKeyDown(event: KeyboardEvent) {
        currentSequence = [...currentSequence, event.key];
        if (currentSequence.length > konamiSequence.length) {
            currentSequence = currentSequence.slice(-konamiSequence.length);
        }

        if (currentSequence.join(',') === konamiSequence.join(',')) {
            showDevTools = true;
            currentSequence = [];
        }
    }
</script>

<svelte:window onkeydown={handleKeyDown} />

{#if showDevTools}
    <div class="dev-tools">
        <h3>Developer Tools</h3>
        <div class="dev-buttons">
            <button onclick={completeRandomWord}>Complete Random Word</button>
            <button onclick={completeAllWords}>Complete All Words</button>
        </div>
    </div>
{/if}

<style>
    .dev-tools {
        position: fixed;
        top: 20px;
        left: 20px;
        background-color: #242424;
        border: 1px solid #646cff;
        border-radius: 8px;
        padding: 1rem;
        z-index: 1000;
    }

    .dev-buttons {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    button {
        padding: 0.5rem 1rem;
        border: 1px solid #646cff;
        border-radius: 4px;
        background: none;
        color: inherit;
        cursor: pointer;
        transition: all 0.2s;
    }

    button:hover {
        background-color: #646cff;
        color: white;
    }
</style> 
<script>
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();

  export let params = [];
  export let reportName = '';
  export let onSubmit = null;
  export let onClose = null;

  let parameterValues = {};
  let loading = false;

  // パラメータ値を初期化
  $: {
    parameterValues = {};
    params.forEach(param => {
      parameterValues[param.name] = param.options?.[0]?.value || '';
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    loading = true;
    
    if (onSubmit) {
      await onSubmit(new CustomEvent('submit', { detail: parameterValues }));
    }
    
    loading = false;
  }

  function handleClose() {
    if (onClose) {
      onClose();
    }
  }
</script>

<!-- モーダルオーバーレイ -->
<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
  <div class="bg-white rounded-lg shadow-2xl max-w-md w-full max-h-96 flex flex-col">
    <!-- ヘッダー -->
    <div class="border-b px-6 py-4 flex justify-between items-center">
      <h2 class="text-xl font-bold text-gray-800">⚙ {reportName} - パラメータ設定</h2>
      <button
        on:click={handleClose}
        disabled={loading}
        class="text-gray-500 hover:text-gray-700 text-2xl disabled:opacity-50"
      >
        ×
      </button>
    </div>

    <!-- フォーム -->
    <form on:submit={handleSubmit} class="flex-1 overflow-y-auto px-6 py-4">
      {#each params as param}
        <div class="mb-4">
          <label for={param.name} class="block text-gray-700 font-semibold mb-2">
            {param.name}
          </label>

          {#if param.type === 'select'}
            <select
              id={param.name}
              bind:value={parameterValues[param.name]}
              class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-webfocus-600"
              disabled={loading}
            >
              {#each param.options as option}
                <option value={option.value}>
                  {option.label}
                </option>
              {/each}
            </select>
          {:else}
            <input
              id={param.name}
              type="text"
              bind:value={parameterValues[param.name]}
              class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-webfocus-600"
              disabled={loading}
            />
          {/if}
        </div>
      {/each}
    </form>

    <!-- フッター -->
    <div class="border-t px-6 py-4 flex gap-2 justify-end">
      <button
        type="button"
        on:click={handleClose}
        disabled={loading}
        class="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 font-semibold rounded transition disabled:opacity-50"
      >
        キャンセル
      </button>
      <button
        type="submit"
        on:click={handleSubmit}
        disabled={loading}
        class="px-4 py-2 bg-webfocus-600 hover:bg-webfocus-700 text-white font-semibold rounded transition disabled:opacity-50"
      >
        {loading ? '実行中...' : '▶ 実行'}
      </button>
    </div>
  </div>
</div>

<style>
</style>

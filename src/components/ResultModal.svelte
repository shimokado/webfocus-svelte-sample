<script>
  import { executionResult } from '../stores/index.js';

  function handleClose() {
    $executionResult = {
      open: false,
      result: null,
      contentType: null,
      error: null
    };
  }

  function handleDownload() {
    if ($executionResult.contentType === 'pdf') {
      const a = document.createElement('a');
      a.href = $executionResult.result;
      a.download = `report_${Date.now()}.pdf`;
      a.click();
    }
  }
</script>

{#if $executionResult.open}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-96 flex flex-col">
      <!-- ヘッダー -->
      <div class="border-b px-6 py-4 flex justify-between items-center">
        <h2 class="text-xl font-bold text-gray-800">実行結果</h2>
        <button
          on:click={handleClose}
          class="text-gray-500 hover:text-gray-700 text-2xl"
        >
          ×
        </button>
      </div>

      <!-- コンテンツ -->
      <div class="flex-1 overflow-y-auto px-6 py-4">
        {#if $executionResult.error}
          <div class="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            <p class="font-semibold">エラーが発生しました</p>
            <p class="mt-2">{$executionResult.error}</p>
          </div>
        {:else if $executionResult.contentType === 'html'}
          <div class="prose prose-sm max-w-none">
            {@html $executionResult.result}
          </div>
        {:else if $executionResult.contentType === 'pdf'}
          <div class="text-center">
            <p class="mb-4">📄 PDFファイルが生成されました</p>
            <button
              on:click={handleDownload}
              class="px-4 py-2 bg-webfocus-600 hover:bg-webfocus-700 text-white font-semibold rounded transition"
            >
              ⬇ ダウンロード
            </button>
          </div>
        {:else}
          <pre class="bg-gray-100 p-4 rounded overflow-x-auto text-sm">{$executionResult.result}</pre>
        {/if}
      </div>

      <!-- フッター -->
      <div class="border-t px-6 py-4 flex justify-end gap-2">
        <button
          on:click={handleClose}
          class="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 font-semibold rounded transition"
        >
          閉じる
        </button>
        {#if $executionResult.contentType === 'pdf'}
          <button
            on:click={handleDownload}
            class="px-4 py-2 bg-webfocus-600 hover:bg-webfocus-700 text-white font-semibold rounded transition"
          >
            ⬇ ダウンロード
          </button>
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  :global(.prose) {
    all: revert;
  }
</style>

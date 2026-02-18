<script>
  import { executionResult } from '../stores/index.js';
  import { runReport, describeFex, runReportWithParams } from '../api/webfocus.js';
  import ParameterModal from './ParameterModal.svelte';

  export let item;

  let showParameterModal = false;
  let loading = false;
  let reportParams = [];

  async function handleNormalRun() {
    loading = true;
    const result = await runReport(item.path);
    
    if (result.success) {
      $executionResult = {
        open: true,
        result: result.result,
        contentType: result.contentType,
        error: null
      };
    } else {
      $executionResult = {
        open: true,
        result: null,
        contentType: null,
        error: result.error
      };
    }
    
    loading = false;
  }

  async function handleCustomRun() {
    loading = true;
    const result = await describeFex(item.path);
    
    if (result.success) {
      reportParams = result.params;
      showParameterModal = true;
    } else {
      $executionResult = {
        open: true,
        result: null,
        contentType: null,
        error: result.error
      };
    }
    
    loading = false;
  }

  async function handleParameterSubmit(event) {
    const parameterValues = event.detail;
    loading = true;
    
    const result = await runReportWithParams(item.path, parameterValues);
    
    if (result.success) {
      $executionResult = {
        open: true,
        result: result.result,
        contentType: result.contentType,
        error: null
      };
    } else {
      $executionResult = {
        open: true,
        result: null,
        contentType: null,
        error: result.error
      };
    }
    
    showParameterModal = false;
    loading = false;
  }
</script>

<div class="bg-white rounded-lg shadow hover:shadow-lg transition overflow-hidden" data-testid="report-card">
  <div class="p-6 h-full flex flex-col">
    <!-- レポート情報 -->
    <div class="flex-1 mb-4">
      <div class="text-3xl mb-3">📊</div>
      <h3 class="font-bold text-gray-800 truncate text-lg">{item.name}</h3>
      <p class="text-xs text-gray-500 mt-2 break-words">{item.path}</p>
    </div>

    <!-- ボタン -->
    <div class="flex gap-2">
      <button
        on:click={handleNormalRun}
        disabled={loading}
        class="flex-1 px-3 py-2 bg-webfocus-600 hover:bg-webfocus-700 text-white text-sm font-semibold rounded transition disabled:opacity-50"
      >
        {loading ? '実行中...' : '▶ 実行'}
      </button>
      <button
        on:click={handleCustomRun}
        disabled={loading}
        class="flex-1 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold rounded transition disabled:opacity-50"
      >
        {loading ? '...' : '⚙ 詳細'}
      </button>
    </div>
  </div>
</div>

{#if showParameterModal}
  <ParameterModal
    params={reportParams}
    reportName={item.name}
    onSubmit={handleParameterSubmit}
    onClose={() => showParameterModal = false}
  />
{/if}

<style>
</style>

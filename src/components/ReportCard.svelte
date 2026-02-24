<script>
  import {
    buildRunUrl,
    buildDescribeFexUrl,
    buildPropertiesUrl,
    buildGetContentUrl,
    buildGetDetailsUrl
  } from '../api/webfocus.js';

  export let item;

  let loading = false;

  function openInNewTab(url) {
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  function handleNormalRun() {
    loading = true;
    const runUrl = buildRunUrl(item.path);
    openInNewTab(runUrl);
    loading = false;
  }

  function handleCustomRun() {
    loading = true;
    const describeUrl = buildDescribeFexUrl(item.path);
    openInNewTab(describeUrl);
    loading = false;
  }

  function handleProperties() {
    loading = true;
    const propertiesUrl = buildPropertiesUrl(item.path);
    openInNewTab(propertiesUrl);
    loading = false;
  }

  function handleGetContent() {
    loading = true;
    const getContentUrl = buildGetContentUrl(item.path);
    openInNewTab(getContentUrl);
    loading = false;
  }

  function handleGetDetails() {
    loading = true;
    const getDetailsUrl = buildGetDetailsUrl(item.path);
    openInNewTab(getDetailsUrl);
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
    <div class="grid grid-cols-2 gap-2">
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
      <button
        on:click={handleProperties}
        disabled={loading}
        class="flex-1 px-3 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold rounded transition disabled:opacity-50"
      >
        {loading ? '...' : '📄 properties'}
      </button>
      <button
        on:click={handleGetContent}
        disabled={loading}
        class="flex-1 px-3 py-2 bg-teal-500 hover:bg-teal-600 text-white text-sm font-semibold rounded transition disabled:opacity-50"
      >
        {loading ? '...' : '📦 getContent'}
      </button>
      <button
        on:click={handleGetDetails}
        disabled={loading}
        class="col-span-2 px-3 py-2 bg-purple-500 hover:bg-purple-600 text-white text-sm font-semibold rounded transition disabled:opacity-50"
      >
        {loading ? '...' : '🔍 getDetails'}
      </button>
    </div>
  </div>
</div>

<style>
</style>

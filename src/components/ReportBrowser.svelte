<script>
  import { currentPath, pathHistory, contents } from '../stores/index.js';
  import { getContents } from '../api/webfocus.js';
  import ReportCard from './ReportCard.svelte';

  let pathHistoryList = ['IBFS:/WFC/Repository/reports'];

  // ストア購読
  pathHistory.subscribe(value => {
    pathHistoryList = value;
  });

  async function handleNavigate(path) {
    if (!path.endsWith('.fex')) {
      $contents.loading = true;
      const result = await getContents(path);
      
      if (result.success) {
        $contents = {
          items: result.items,
          loading: false,
          error: null
        };
        $currentPath = path;
        
        // パンくずリストを更新
        const pathSegments = path.split('/');
        $pathHistory = [path];
      } else {
        $contents = {
          items: [],
          loading: false,
          error: result.error
        };
      }
    }
  }

  async function goToPath(path) {
    await handleNavigate(path);
  }

  async function goBack() {
    if (pathHistoryList.length > 1) {
      pathHistoryList = pathHistoryList.slice(0, -1);
      await goToPath(pathHistoryList[pathHistoryList.length - 1]);
    }
  }

  async function loadInitialContent() {
    const result = await getContents($currentPath);
    if (result.success) {
      $contents = {
        items: result.items,
        loading: false,
        error: null
      };
    } else {
      $contents = {
        items: [],
        loading: false,
        error: result.error
      };
    }
  }

  // マウント時に初期化
  import { onMount } from 'svelte';
  onMount(() => {
    loadInitialContent();
  });
</script>

<div class="container mx-auto px-4 py-6">
  <!-- パンくずリスト/ナビゲーション -->
  <div class="mb-6 flex items-center gap-2">
    {#if pathHistoryList.length > 1}
      <button
        on:click={goBack}
        class="px-3 py-1 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded transition"
      >
        ← 戻る
      </button>
    {/if}

    <div class="flex-1 flex items-center gap-2 text-sm">
      <button
        on:click={() => goToPath('IBFS:/WFC/Repository/reports')}
        class="text-webfocus-600 hover:text-webfocus-700 font-semibold underline"
      >
        Reports
      </button>

      {#each $currentPath.split('/').slice(4) as segment, idx}
        <span class="text-gray-500">/</span>
        <button
          on:click={() => {
            const path = 'IBFS:/WFC/Repository/reports/' + $currentPath.split('/').slice(4, idx + 5).join('/');
            goToPath(path);
          }}
          class="text-webfocus-600 hover:text-webfocus-700 font-semibold underline"
        >
          {segment}
        </button>
      {/each}
    </div>

    <button
      on:click={() => loadInitialContent()}
      class="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded transition"
    >
      🔄 更新
    </button>
  </div>

  <!-- エラーメッセージ -->
  {#if $contents.error}
    <div class="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
      エラー: {$contents.error}
    </div>
  {/if}

  <!-- ローディング -->
  {#if $contents.loading}
    <div class="text-center py-8">
      <p class="text-gray-600">読み込み中...</p>
    </div>
  {:else}
    <!-- コンテンツグリッド -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {#each $contents.items as item (item.path)}
        {#if item.isFolder}
          <!-- フォルダカード -->
          <div
            class="bg-white rounded-lg shadow hover:shadow-lg transition cursor-pointer p-6"
            data-testid="folder-card"
            on:click={() => handleNavigate(item.path)}
            role="button"
            tabindex="0"
            on:keydown={(e) => e.key === 'Enter' && handleNavigate(item.path)}
          >
            <div class="text-4xl mb-3">📁</div>
            <h3 class="font-bold text-gray-800 truncate">{item.name}</h3>
            <p class="text-xs text-gray-500 mt-1">{item.type}</p>
          </div>
        {/if}
      {/each}

      {#each $contents.items as item (item.path)}
        {#if item.isFex}
          <ReportCard {item} />
        {/if}
      {/each}
    </div>

    <!-- 空の場合 -->
    {#if $contents.items.length === 0}
      <div class="text-center py-12">
        <p class="text-gray-500 text-lg">コンテンツがありません</p>
      </div>
    {/if}
  {/if}
</div>

<style>
</style>

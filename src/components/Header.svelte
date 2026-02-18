<script>
  import { auth } from '../stores/index.js';
  import { signOn } from '../api/webfocus.js';

  let username = '';
  let password = '';
  let loading = false;
  let error = null;

  async function handleLogin(e) {
    e.preventDefault();
    loading = true;
    error = null;

    const result = await signOn(username, password);
    
    if (result.success) {
      auth.set({
        isLoggedIn: true,
        user: result.user,
        tokens: result.tokens,
        error: null
      });
    } else {
      error = result.error;
    }
    
    loading = false;
  }

  function handleLogout() {
    auth.set({
      isLoggedIn: false,
      user: null,
      tokens: null,
      error: null
    });
  }
</script>

<div class="bg-white shadow">
  <div class="container mx-auto px-4 py-4">
    <div class="flex justify-between items-center">
      <div class="flex items-center">
        <h1 class="text-2xl font-bold text-webfocus-700 mr-4">WebFOCUS レポート管理</h1>
      </div>

      <div>
        {#if $auth.isLoggedIn}
          <div class="flex items-center gap-4">
            <span class="text-gray-700">ユーザー: <strong>{$auth.user}</strong></span>
            <button
              on:click={handleLogout}
              class="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded transition"
            >
              ログアウト
            </button>
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>

{#if !$auth.isLoggedIn}
  <div class="container mx-auto px-4 py-8">
    <div class="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8">
      <h2 class="text-2xl font-bold text-gray-800 mb-6">ログイン</h2>

      {#if error}
        <div class="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      {/if}

      <form on:submit={handleLogin}>
        <div class="mb-4">
          <label for="username" class="block text-gray-700 font-bold mb-2">
            ユーザー名
          </label>
          <input
            id="username"
            type="text"
            bind:value={username}
            class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-webfocus-600"
            disabled={loading}
            required
          />
        </div>

        <div class="mb-6">
          <label for="password" class="block text-gray-700 font-bold mb-2">
            パスワード
          </label>
          <input
            id="password"
            type="password"
            bind:value={password}
            class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-webfocus-600"
            disabled={loading}
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          class="w-full px-4 py-2 bg-webfocus-600 hover:bg-webfocus-700 text-white font-bold rounded transition disabled:opacity-50"
        >
          {loading ? 'ログイン中...' : 'ログイン'}
        </button>
      </form>
    </div>
  </div>
{/if}

<style>
</style>

import { writable } from 'svelte/store';

// 認証状態
export const auth = writable({
  isLoggedIn: false,
  user: null,
  tokens: null,
  error: null
});

// 現在のパス
export const currentPath = writable('IBFS:/WFC/Repository/reports');

// フォルダナビゲーション（パンくずリスト用）
export const pathHistory = writable(['IBFS:/WFC/Repository/reports']);

// レポート一覧
export const contents = writable({
  items: [],
  loading: false,
  error: null
});

// 実行結果
export const executionResult = writable({
  open: false,
  result: null,
  contentType: null,
  error: null
});

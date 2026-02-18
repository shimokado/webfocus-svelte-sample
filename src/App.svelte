<script>
  import Header from './components/Header.svelte';
  import ReportBrowser from './components/ReportBrowser.svelte';
  import ResultModal from './components/ResultModal.svelte';
  import { auth } from './stores/index.js';
</script>

<main>
  <Header />
  {#if $auth.isLoggedIn}
    <ReportBrowser />
  {/if}
  <ResultModal />
</main>



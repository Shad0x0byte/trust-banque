<script lang="ts">
  import { auth } from '$lib/stores/auth';
  import { goto } from '$app/navigation';
  
  let mobileMenuOpen = false;
  
  function handleLogout() {
    auth.clearAuth();
    goto('/login');
  }
</script>

<nav class="bg-primary text-white shadow-lg sticky top-0 z-50">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="flex justify-between h-16">
      <!-- Logo -->
      <div class="flex items-center">
        <a href="/" class="flex items-center gap-2">
          <div class="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
            <span class="text-xl font-bold">🏦</span>
          </div>
          <div>
            <span class="font-bold text-xl tracking-tight block">Trust Bank</span>
            <span class="text-xs text-slate-400 -mt-1 block">Powered by Trust</span>
          </div>
        </a>
      </div>
      
      <!-- Desktop Navigation -->
      <div class="hidden md:flex items-center gap-6">
        {#if $auth.isAuthenticated}
          <a href="/dashboard" class="text-slate-300 hover:text-white transition-colors text-sm font-medium">Dashboard</a>
          <a href="/dashboard/accounts" class="text-slate-300 hover:text-white transition-colors text-sm font-medium">Accounts</a>
          <a href="/dashboard/transfer" class="text-slate-300 hover:text-white transition-colors text-sm font-medium">Transfer</a>
          <a href="/dashboard/settings" class="text-slate-300 hover:text-white transition-colors text-sm font-medium">Settings</a>
          
          <div class="flex items-center gap-3 ml-4 pl-4 border-l border-slate-700">
            <div class="text-right">
              <p class="text-sm font-medium">{ $auth.user?.first_name } { $auth.user?.last_name }</p>
              <p class="text-xs text-slate-400">{ $auth.user?.email }</p>
            </div>
            <button 
              on:click={handleLogout}
              class="text-sm text-slate-300 hover:text-white transition-colors"
            >
              Sign Out
            </button>
          </div>
        {:else}
          <a href="/login" class="text-slate-300 hover:text-white transition-colors text-sm font-medium">Sign In</a>
          <a href="/signup" class="btn-primary text-sm">Open Account</a>
        {/if}
      </div>
      
      <!-- Mobile menu button -->
      <div class="md:hidden flex items-center">
        <button 
          on:click={() => mobileMenuOpen = !mobileMenuOpen}
          class="text-slate-300 hover:text-white p-2"
        >
          {#if mobileMenuOpen}
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          {:else}
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          {/if}
        </button>
      </div>
    </div>
  </div>
  
  <!-- Mobile Menu -->
  {#if mobileMenuOpen}
    <div class="md:hidden bg-primary-light border-t border-slate-700">
      <div class="px-4 py-4 space-y-3">
        {#if $auth.isAuthenticated}
          <a href="/dashboard" class="block text-slate-300 hover:text-white py-2">Dashboard</a>
          <a href="/dashboard/accounts" class="block text-slate-300 hover:text-white py-2">Accounts</a>
          <a href="/dashboard/transfer" class="block text-slate-300 hover:text-white py-2">Transfer</a>
          <a href="/dashboard/settings" class="block text-slate-300 hover:text-white py-2">Settings</a>
          <button on:click={handleLogout} class="block text-danger py-2 w-full text-left">Sign Out</button>
        {:else}
          <a href="/login" class="block text-slate-300 hover:text-white py-2">Sign In</a>
          <a href="/signup" class="block btn-primary text-center py-2">Open Account</a>
        {/if}
      </div>
    </div>
  {/if}
</nav>
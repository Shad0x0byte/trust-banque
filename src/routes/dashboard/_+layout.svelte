<script lang="ts">
  import '../../app.css';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { auth } from '$lib/stores/auth';
  import Toast from '$lib/components/Toast.svelte';
  import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
  import type { AuthState } from '$lib/types';
  
  let sidebarOpen = false;
  let authState: AuthState = { isAuthenticated: false, user: null, token: null, loading: true };
  
  onMount(() => {
    auth.loadFromStorage();
    
    // Subscribe to auth store changes
    const unsubscribe = auth.subscribe((state) => {
      authState = state;
      if (!state.loading && !state.isAuthenticated) {
        goto('/login');
      }
    });
    
    return () => unsubscribe();
  });
  
  const navItems = [
    { href: '/dashboard', label: 'Overview', icon: '📊' },
    { href: '/dashboard/accounts', label: 'Accounts', icon: '💳' },
    { href: '/dashboard/transactions', label: 'Transactions', icon: '📋' },
    { href: '/dashboard/transfer', label: 'Transfer', icon: '💸' },
    { href: '/dashboard/cards', label: 'Cards', icon: '🏧' },
    { href: '/dashboard/statements', label: 'Statements', icon: '📄' },
    { href: '/dashboard/settings', label: 'Settings', icon: '⚙️' },
    { href: '/dashboard/security', label: 'Security', icon: '🔒' },
  ];
  
  function handleLogout() {
    auth.clearAuth();
    goto('/login');
  }
</script>

<div class="min-h-screen bg-slate-50">
  <!-- Mobile Header -->
  <header class="lg:hidden bg-primary text-white p-4 flex items-center justify-between sticky top-0 z-40">
    <div class="flex items-center gap-2">
      <span class="text-xl">🏦</span>
      <span class="font-bold">Trust Banque</span>
    </div>
    <button on:click={() => sidebarOpen = !sidebarOpen} class="text-white p-2">
      {#if sidebarOpen}
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      {:else}
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      {/if}
    </button>
  </header>
  
  <div class="flex">
    <!-- Sidebar -->
    <aside class="fixed lg:sticky top-0 left-0 h-screen w-64 bg-primary text-white transform {sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform z-50">
      <div class="p-6">
        <a href="/" class="flex items-center gap-2 mb-8">
          <div class="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
            <span class="text-xl font-bold">🏦</span>
          </div>
          <span class="font-bold text-xl">Trust Banque</span>
        </a>
        
        <!-- User Info -->
        <div class="mb-6 p-4 bg-primary-light rounded-lg">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-10 h-10 rounded-full bg-accent flex items-center justify-center font-bold">
              { authState.user?.first_name?.charAt(0) }{ authState.user?.last_name?.charAt(0) }
            </div>
            <div class="overflow-hidden">
              <p class="font-medium text-sm truncate">{ authState.user?.first_name } { authState.user?.last_name }</p>
              <p class="text-xs text-slate-400 truncate">{ authState.user?.email }</p>
            </div>
          </div>
        </div>
        
        <!-- Navigation -->
        <nav class="space-y-1">
          {#each navItems as item}
            <a
              href={item.href}
              class="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-primary-light hover:text-white transition-colors"
              class:text-accent={$page.url.pathname === item.href}
            >
              <span class="text-lg">{item.icon}</span>
              <span class="text-sm font-medium">{item.label}</span>
            </a>
          {/each}
        </nav>
      </div>
      
      <!-- Logout -->
      <div class="absolute bottom-0 left-0 right-0 p-6 border-t border-slate-700">
        <button on:click={handleLogout} class="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-slate-300 hover:bg-red-500/10 hover:text-red-400 transition-colors">
          <span class="text-lg">🚪</span>
          <span class="text-sm font-medium">Sign Out</span>
        </button>
      </div>
    </aside>
    
    <!-- Overlay for mobile -->
    {#if sidebarOpen}
      <div class="fixed inset-0 bg-black/50 z-40 lg:hidden" on:click={() => sidebarOpen = false}></div>
    {/if}
    
    <!-- Main Content -->
    <main class="flex-1 lg:ml-64">
      {#if authState.loading}
        <div class="min-h-screen flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      {:else}
        <slot />
      {/if}
    </main>
  </div>
  
  <Toast />
</div>
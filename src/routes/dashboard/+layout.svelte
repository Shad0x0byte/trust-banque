<script lang="ts">
  import { page }    from '$app/stores';
  import { auth }    from '$lib/stores/auth';
  import { goto }    from '$app/navigation';
  import { onMount } from 'svelte';
  import { apiRequest } from '$lib/api/client';
  import DashboardFooter from '$lib/components/DashboardFooter.svelte';

  let authState: any = { user: null, isAuthenticated: false, loading: true };
  let sidebarOpen = false;
  let profilePictureUrl: string | null = null;

  auth.subscribe(s => {
    authState = s;
    // read picture from store (updated after profile fetch)
    profilePictureUrl = (s.user as any)?.profile_picture_url ?? null;
  });

  onMount(() => {
    auth.loadFromStorage();
    // Fetch fresh profile to get the current profile picture
    apiRequest<any>('/user/profile.php').then(res => {
      if (res.success && res.data?.user) {
        const u = res.data.user;
        profilePictureUrl = u.profile_picture_url ?? null;
        auth.updateUser({ profile_picture_url: profilePictureUrl } as any);
      }
    });
  });

  const unsubscribe = auth.subscribe(s => {
    if (!s.loading && !s.isAuthenticated) goto('/login');
  });

  import { onDestroy } from 'svelte';
  onDestroy(unsubscribe);

  $: currentPath = $page.url.pathname;

  const navItems = [
    { href: '/dashboard',              icon: '⊞',  label: 'Overview' },
    { href: '/dashboard/accounts',     icon: '🏛',  label: 'Accounts' },
    { href: '/dashboard/transfer',     icon: '↗',   label: 'Transfer' },
    { href: '/dashboard/transactions', icon: '≡',   label: 'History' },
    { href: '/dashboard/cards',        icon: '▭',   label: 'Cards' },
    { href: '/dashboard/statements',   icon: '📄',  label: 'Statements' },
    { href: '/dashboard/security',     icon: '🔐',  label: 'Security' },
  ];

  // Bottom nav items (mobile — top 5 most used)
  const mobileNavItems = [
    { href: '/dashboard',              icon: '⊞',  label: 'Home' },
    { href: '/dashboard/accounts',     icon: '🏛',  label: 'Accounts' },
    { href: '/dashboard/transfer',     icon: '↗',   label: 'Transfer' },
    { href: '/dashboard/transactions', icon: '≡',   label: 'History' },
    { href: '/dashboard/cards',        icon: '▭',   label: 'Cards' },
  ];

  function isActive(href: string) {
    if (href === '/dashboard') return currentPath === '/dashboard';
    return currentPath.startsWith(href);
  }

  async function handleSignOut() {
    auth.clearAuth();
    goto('/login');
  }

  $: userName  = authState.user ? `${authState.user.first_name ?? ''} ${authState.user.last_name ?? ''}`.trim() : '';
  $: userEmail = authState.user?.email ?? '';
  $: initials  = userName ? userName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0,2) : 'TB';
</script>

{#if authState.loading}
  <div class="flex min-h-screen items-center justify-center bg-slate-50">
    <div class="flex flex-col items-center gap-4">
      <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 shadow-lg">
        <span class="text-2xl">🏦</span>
      </div>
      <div class="h-1 w-32 overflow-hidden rounded-full bg-slate-200">
        <div class="h-full w-1/2 rounded-full bg-emerald-500 animate-pulse"></div>
      </div>
    </div>
  </div>
{:else if authState.isAuthenticated}
<div class="flex min-h-screen bg-slate-50/80">

  <!-- ── Sidebar overlay (mobile) ──────────────────────────────── -->
  {#if sidebarOpen}
    <div class="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
         on:click={() => sidebarOpen = false}
         role="presentation"></div>
  {/if}

  <!-- ── Sidebar ────────────────────────────────────────────────── -->
  <aside class="fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-white shadow-2xl
                transform transition-transform duration-300 ease-out
                {sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:shadow-none lg:border-r lg:border-slate-200/80">

    <!-- Logo -->
    <div class="flex h-16 items-center gap-3 border-b border-slate-100 px-5">
      <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-600 shadow">
        <span class="text-lg">🏦</span>
      </div>
      <div>
        <p class="text-base font-bold text-slate-900" style="font-family: 'Sora', sans-serif; letter-spacing: -0.02em;">Trust Banque</p>
        <p class="text-[10px] font-medium uppercase tracking-widest text-emerald-600">Secure Banking</p>
      </div>
      <!-- Close on mobile -->
      <button class="ml-auto rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 lg:hidden"
              on:click={() => sidebarOpen = false}>
        <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
    </div>

    <!-- Nav -->
    <nav class="flex-1 overflow-y-auto px-3 py-4">
      <ul class="space-y-0.5">
        {#each navItems as item}
          <li>
            <a href={item.href}
               class="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all
               {isActive(item.href)
                 ? 'bg-emerald-50 text-emerald-700 shadow-sm'
                 : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}"
               on:click={() => sidebarOpen = false}>
              <span class="text-base w-5 text-center shrink-0">{item.icon}</span>
              <span style="font-family: 'Inter', sans-serif;">{item.label}</span>
              {#if isActive(item.href)}
                <span class="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
              {/if}
            </a>
          </li>
        {/each}
      </ul>
    </nav>

    <!-- Profile card -->
    <div class="border-t border-slate-100 p-3">
      <div class="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
        <!-- Avatar -->
        <div class="relative h-10 w-10 shrink-0">
          {#if profilePictureUrl}
            <img src={profilePictureUrl} alt={userName}
                 class="h-10 w-10 rounded-full object-cover ring-2 ring-emerald-500/30"
                 on:error={(e) => { profilePictureUrl = null; }} />
          {:else}
            <div class="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-sm font-bold text-white shadow">
              {initials}
            </div>
          {/if}
          <span class="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white"></span>
        </div>
        <div class="min-w-0 flex-1">
          <p class="truncate text-sm font-semibold text-slate-800">{userName}</p>
          <p class="truncate text-xs text-slate-400">{userEmail}</p>
        </div>
        <button on:click={handleSignOut}
                class="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-white hover:text-red-500"
                title="Sign out">
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
          </svg>
        </button>
      </div>
    </div>
  </aside>

  <!-- ── Main area ─────────────────────────────────────────────── -->
  <div class="flex min-w-0 flex-1 flex-col lg:ml-72">

    <!-- Top bar -->
    <header class="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur-md sm:px-6">
      <!-- Hamburger (mobile only) -->
      <button class="rounded-xl p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
              on:click={() => sidebarOpen = !sidebarOpen}>
        <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
        </svg>
      </button>

      <!-- Page title reactive -->
      <div class="flex-1">
        <p class="text-sm font-semibold text-slate-900" style="font-family: 'Sora', sans-serif;">
          {#if currentPath === '/dashboard'}Good day, {authState.user?.first_name ?? 'there'} 👋
          {:else if currentPath.includes('accounts')}Accounts
          {:else if currentPath.includes('transfer')}Send Money
          {:else if currentPath.includes('transactions')}Transaction History
          {:else if currentPath.includes('cards')}Cards
          {:else if currentPath.includes('statements')}Statements
          {:else if currentPath.includes('security')}Security
          {:else}Dashboard
          {/if}
        </p>
      </div>

      <!-- Quick actions -->
      <div class="flex items-center gap-2">
        <a href="/dashboard/transfer"
           class="hidden rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors sm:inline-flex items-center gap-1.5">
          <span>↗</span> Send Money
        </a>
        <!-- Avatar -->
        <button class="relative h-8 w-8 overflow-hidden rounded-full ring-2 ring-slate-200 hover:ring-emerald-400 transition-all">
          {#if profilePictureUrl}
            <img src={profilePictureUrl} alt={userName} class="h-full w-full object-cover" />
          {:else}
            <div class="flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-500 to-teal-600 text-xs font-bold text-white">
              {initials}
            </div>
          {/if}
        </button>
      </div>
    </header>

    <!-- Page content -->
    <main class="flex-1 px-4 py-6 sm:px-6 lg:px-8 pb-24 lg:pb-8">
      <slot />
    </main>

    <!-- Footer (desktop only — mobile has bottom nav) -->
    <div class="hidden lg:block">
      <DashboardFooter />
    </div>
  </div>

  <!-- ── Mobile bottom navigation ───────────────────────────────── -->
  <nav class="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 safe-bottom lg:hidden">
    <div class="flex items-stretch">
      {#each mobileNavItems as item}
        <a href={item.href}
           class="flex flex-1 flex-col items-center justify-center gap-0.5 py-3 transition-all
           {isActive(item.href) ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'}">
          <span class="text-lg leading-none">{item.icon}</span>
          <span class="text-[10px] font-medium">{item.label}</span>
          {#if isActive(item.href)}
            <span class="absolute bottom-1.5 h-1 w-4 rounded-full bg-emerald-500"></span>
          {/if}
        </a>
      {/each}
      <!-- More button leading to menu -->
      <button class="flex flex-1 flex-col items-center justify-center gap-0.5 py-3 text-slate-400 hover:text-slate-600"
              on:click={() => sidebarOpen = true}>
        <span class="text-lg leading-none">⋯</span>
        <span class="text-[10px] font-medium">More</span>
      </button>
    </div>
  </nav>

</div>
{/if}

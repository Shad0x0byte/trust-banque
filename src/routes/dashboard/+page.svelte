<script lang="ts">
  import { onMount } from 'svelte';
  import { auth } from '$lib/stores/auth';
  import { apiRequest } from '$lib/api/client';
  import { formatCurrency, formatDate } from '$lib/utils/formatters';
  import { goto } from '$app/navigation';
  import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';

  let loading = true;
  let user: any = null;
  let accounts: any[] = [];
  let transactions: any[] = [];

  onMount(async () => {
    const res = await apiRequest<any>('/user/profile.php');
    loading = false;
    if (res.success && res.data) {
      user = res.data.user;
      accounts = res.data.accounts;
      // Sync picture URL into auth store so sidebar updates
      auth.updateUser({
        profile_picture_url: res.data.user.profile_picture_url ?? null,
        profile_picture:     res.data.user.profile_picture ?? null,
      } as any);
    }
    const txRes = await apiRequest<any>('/transactions/list.php?limit=8');
    if (txRes.success && txRes.data) transactions = txRes.data.transactions;
  });

  $: totalBalance       = accounts.reduce((s, a) => s + a.balance, 0);
  $: checkingAccounts   = accounts.filter(a => a.account_type === 'checking');
  $: savingsAccounts    = accounts.filter(a => a.account_type === 'savings');

  let authState: any = {};
  auth.subscribe(s => { authState = s; });

  function greeting() {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
  }
</script>

<svelte:head><title>Dashboard — Trust Banque</title></svelte:head>

{#if loading}
  <div class="flex items-center justify-center py-32"><LoadingSpinner size="lg" /></div>
{:else}
<div class="space-y-6 fade-in">

  <!-- Welcome header -->
  <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <h1 class="font-display text-2xl font-semibold text-slate-900 sm:text-3xl">
        {greeting()}, {user?.first_name ?? 'there'} 👋
      </h1>
      <p class="mt-1 text-sm text-slate-500">Here's your financial overview for today.</p>
    </div>
    <a href="/dashboard/transfer"
      class="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors self-start sm:self-auto">
      <span>💸</span> New Transfer
    </a>
  </div>

  <!-- Total balance hero card -->
  <div class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 text-white shadow-xl sm:p-8">
    <div class="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-emerald-500/10 blur-3xl"></div>
    <div class="absolute bottom-0 left-1/4 h-32 w-32 rounded-full bg-emerald-400/5 blur-2xl"></div>
    <p class="text-xs font-semibold tracking-widest text-slate-400 uppercase mb-1">Total Portfolio Balance</p>
    <p class="font-display text-4xl font-semibold tracking-tight mb-5 sm:text-5xl">{formatCurrency(totalBalance)}</p>
    <div class="flex flex-wrap gap-6">
      <div>
        <p class="text-xs text-slate-500 mb-1">Checking</p>
        <p class="text-lg font-semibold text-emerald-400">{formatCurrency(checkingAccounts.reduce((s,a)=>s+a.balance,0))}</p>
      </div>
      {#if savingsAccounts.length > 0}
      <div>
        <p class="text-xs text-slate-500 mb-1">Savings</p>
        <p class="text-lg font-semibold text-blue-400">{formatCurrency(savingsAccounts.reduce((s,a)=>s+a.balance,0))}</p>
      </div>
      {/if}
      <div>
        <p class="text-xs text-slate-500 mb-1">Accounts</p>
        <p class="text-lg font-semibold text-white">{accounts.length}</p>
      </div>
    </div>
  </div>

  <!-- Quick actions -->
  <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
    {#each [
      ['/dashboard/transfer',     '💸', 'Transfer'],
      ['/dashboard/accounts',     '💳', 'Accounts'],
      ['/dashboard/transactions', '📋', 'History'],
      ['/dashboard/security',     '🔒', 'Security'],
    ] as [href, icon, label]}
      <a {href} class="flex flex-col items-center gap-2 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm hover:border-emerald-200 hover:shadow-md transition-all card-hover sm:p-5">
        <span class="text-2xl">{icon}</span>
        <span class="text-xs font-semibold text-slate-700 sm:text-sm">{label}</span>
      </a>
    {/each}
  </div>

  <!-- Accounts list -->
  <div class="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
    <div class="flex items-center justify-between border-b border-slate-100 px-5 py-4">
      <h2 class="font-display text-base font-semibold text-slate-900 sm:text-lg">Your Accounts</h2>
      <a href="/dashboard/accounts" class="text-xs font-semibold text-emerald-600 hover:underline sm:text-sm">View all →</a>
    </div>
    {#if accounts.length === 0}
      <p class="px-5 py-10 text-center text-sm text-slate-500">No accounts found.</p>
    {:else}
      <div class="divide-y divide-slate-50">
        {#each accounts as acc}
          <div class="flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors">
            <div class="flex items-center gap-3 sm:gap-4">
              <div class="flex h-10 w-10 items-center justify-center rounded-xl {acc.account_type === 'checking' ? 'bg-emerald-100' : 'bg-blue-100'} text-xl sm:h-12 sm:w-12 sm:rounded-2xl">
                {acc.account_type === 'checking' ? '💳' : '💰'}
              </div>
              <div>
                <p class="text-sm font-semibold text-slate-900 sm:text-base">{acc.nickname || (acc.account_type === 'checking' ? 'Checking' : 'Savings')}</p>
                <p class="text-xs text-slate-400 font-mono">••••{acc.account_number.slice(-4)}</p>
              </div>
            </div>
            <div class="text-right">
              <p class="text-lg font-bold text-slate-900 sm:text-xl">{formatCurrency(acc.balance)}</p>
              <p class="text-xs text-slate-400 capitalize">{acc.status}</p>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>

  <!-- Recent transactions -->
  <div class="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
    <div class="flex items-center justify-between border-b border-slate-100 px-5 py-4">
      <h2 class="font-display text-base font-semibold text-slate-900 sm:text-lg">Recent Transactions</h2>
      <a href="/dashboard/transactions" class="text-xs font-semibold text-emerald-600 hover:underline sm:text-sm">View all →</a>
    </div>
    {#if transactions.length === 0}
      <div class="px-5 py-12 text-center">
        <p class="text-3xl mb-3">💳</p>
        <p class="font-semibold text-slate-700">No transactions yet</p>
        <p class="text-sm text-slate-400 mt-1">Your transaction history will appear here</p>
      </div>
    {:else}
      <div class="divide-y divide-slate-50">
        {#each transactions as tx}
          <div class="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition-colors">
            <div class="flex items-center gap-3 min-w-0">
              <div class="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl {tx.amount >= 0 ? 'bg-green-100' : 'bg-slate-100'} text-base">
                {tx.amount >= 0 ? '📥' : tx.type === 'payment' ? '🛍️' : '📤'}
              </div>
              <div class="min-w-0">
                <p class="text-sm font-semibold text-slate-900 truncate">{tx.description}</p>
                <p class="text-xs text-slate-400 truncate">{tx.merchant || tx.type} · {formatDate(tx.created_at)}</p>
              </div>
            </div>
            <span class="ml-3 flex-shrink-0 text-sm font-bold {tx.amount >= 0 ? 'text-green-600' : 'text-slate-900'}">
              {tx.amount >= 0 ? '+' : ''}{formatCurrency(tx.amount)}
            </span>
          </div>
        {/each}
      </div>
    {/if}
  </div>

</div>
{/if}

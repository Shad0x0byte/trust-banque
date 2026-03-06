<script lang="ts">
  // src/routes/dashboard/accounts/+page.svelte
  // Fetches real account data from the API and displays account cards + detail table.

  import { onMount }  from 'svelte';
  import { apiRequest } from '$lib/api/client';
  import { formatCurrency, formatDate, formatFullAccountNumber } from '$lib/utils/formatters';
  import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
  import type { Account } from '$lib/types';

  let loading  = true;
  let accounts: Account[] = [];

  onMount(async () => {
    const res = await apiRequest<any>('/user/profile.php');
    loading = false;
    if (res.success && res.data) {
      accounts = res.data.accounts ?? [];
    }
  });

  function getAccountIcon(type: string): string {
    return type === 'checking' ? '💳' : type === 'savings' ? '💰' : '🏧';
  }

  function getAPY(type: string): string {
    return type === 'checking' ? '0.01%' : type === 'savings' ? '2.50%' : '18.99%';
  }

  function getStatusClass(status: string): string {
    return status === 'active' ? 'bg-green-100 text-green-800'
         : status === 'frozen' ? 'bg-amber-100 text-amber-800'
         : 'bg-red-100 text-red-800';
  }
</script>

<svelte:head>
  <title>Accounts - Trust Banque</title>
</svelte:head>

<div class="space-y-8">

  <!-- Header -->
  <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
    <div>
      <h1 class="text-3xl font-bold tracking-tight text-slate-900">Your Accounts</h1>
      <p class="mt-1 text-slate-600">Manage all your banking accounts in one place.</p>
    </div>
    <a
      href="/dashboard/transfer"
      class="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-emerald-700 transition-colors w-fit"
    >
      <span>💸</span> Make a Transfer
    </a>
  </div>

  {#if loading}
    <div class="flex items-center justify-center py-32"><LoadingSpinner size="lg" /></div>

  {:else if accounts.length === 0}
    <div class="rounded-2xl border border-slate-100 bg-white p-12 text-center shadow-sm">
      <p class="text-4xl mb-4">🏦</p>
      <p class="font-semibold text-slate-700">No accounts found</p>
      <p class="text-sm text-slate-400 mt-1">Your accounts will appear here once created.</p>
    </div>

  {:else}

  <!-- Account Cards -->
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {#each accounts as account}
      <div class="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">

        <div class="flex items-start justify-between mb-4">
          <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-3xl">
            {getAccountIcon(account.account_type)}
          </div>
          <span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize {getStatusClass(account.status)}">
            {account.status}
          </span>
        </div>

        <h3 class="font-bold text-lg text-slate-900 mb-1">{account.nickname || account.account_type}</h3>
        <p class="text-sm text-slate-400 font-mono mb-4">••••{account.account_number.slice(-4)}</p>

        <div class="mb-4">
          <p class="text-xs text-slate-500 mb-1">Current Balance</p>
          <p class="text-2xl font-bold text-slate-900">{formatCurrency(account.balance)}</p>
        </div>

        <div class="space-y-2 mb-6 text-sm">
          <div class="flex justify-between">
            <span class="text-slate-500">Available</span>
            <span class="font-medium">{formatCurrency(account.available_balance)}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-500">APY</span>
            <span class="font-medium text-emerald-600">{getAPY(account.account_type)}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-500">Opened</span>
            <span class="font-medium">{formatDate(account.opened_date)}</span>
          </div>
        </div>

        <a
          href="/dashboard/transfer"
          class="block w-full text-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
        >
          Transfer
        </a>
      </div>
    {/each}
  </div>

  <!-- Account Details Table -->
  <div class="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
    <div class="border-b border-slate-100 px-6 py-4">
      <h3 class="font-bold text-lg text-slate-900">Account Details</h3>
    </div>
    <div class="overflow-x-auto">
      <table class="w-full">
        <thead class="bg-slate-50">
          <tr>
            {#each ['Account','Type','Account Number','Routing Number','Status','Balance'] as h}
              <th class="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
            {/each}
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-50">
          {#each accounts as acc}
            <tr class="hover:bg-slate-50 transition-colors">
              <td class="px-6 py-4 font-medium text-slate-900">{acc.nickname || acc.account_type}</td>
              <td class="px-6 py-4 capitalize text-slate-600">{acc.account_type}</td>
              <td class="px-6 py-4"><code class="text-xs bg-slate-100 px-2 py-1 rounded">{formatFullAccountNumber(acc.account_number)}</code></td>
              <td class="px-6 py-4"><code class="text-xs bg-slate-100 px-2 py-1 rounded">{acc.routing_number}</code></td>
              <td class="px-6 py-4"><span class="rounded-full px-2.5 py-0.5 text-xs font-medium capitalize {getStatusClass(acc.status)}">{acc.status}</span></td>
              <td class="px-6 py-4 font-bold text-slate-900">{formatCurrency(acc.balance)}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>

  {/if}
</div>

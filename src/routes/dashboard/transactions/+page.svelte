<script lang="ts">
  // src/routes/dashboard/transactions/+page.svelte
  // Fetches real transaction history from the API.
  // Supports filtering by type, category, and text search.

  import { onMount }  from 'svelte';
  import { apiRequest } from '$lib/api/client';
  import { formatCurrency, formatDate } from '$lib/utils/formatters';
  import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
  import type { Transaction, Account } from '$lib/types';

  // ── State ──────────────────────────────────────────────────────────────
  let loading      = true;
  let transactions: Transaction[] = [];
  let accounts: Account[]         = [];
  let selectedAccountId           = '';  // '' = all accounts

  let filterType       = 'all';
  let selectedCategory = 'All';
  let searchQuery      = '';
  let selectedTx: Transaction | null = null;

  const categories = [
    'All','Income','Housing','Groceries','Transportation','Utilities',
    'Food','Entertainment','Shopping','Health','Insurance','Savings',
    'Transfer','Fees','Other',
  ];

  // ── Load data ──────────────────────────────────────────────────────────
  onMount(async () => {
    // Load accounts so user can filter by account
    const profileRes = await apiRequest<any>('/user/profile.php');
    if (profileRes.success && profileRes.data) {
      accounts = profileRes.data.accounts ?? [];
    }

    // Load transactions (all accounts, latest 100)
    await loadTransactions();
  });

  async function loadTransactions() {
    loading = true;
    const params: Record<string, unknown> = { limit: 100 };
    if (selectedAccountId) params.account_id = selectedAccountId;

    const res = await apiRequest<any>(`/transactions/list.php?${new URLSearchParams(
      Object.fromEntries(Object.entries(params).map(([k,v])=>[k,String(v)]))
    ).toString()}`);
    loading = false;

    if (res.success && res.data) {
      transactions = res.data.transactions ?? [];
    }
  }

  // ── Filtered view ──────────────────────────────────────────────────────
  $: filtered = transactions.filter(tx => {
    if (filterType !== 'all' && tx.type !== filterType) return false;
    if (selectedCategory !== 'All' && tx.category !== selectedCategory) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        tx.description?.toLowerCase().includes(q) ||
        tx.merchant?.toLowerCase().includes(q)    ||
        tx.reference_number?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  $: totalCredit = filtered.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  $: totalDebit  = filtered.filter(t => t.amount < 0).reduce((s, t) => s + t.amount, 0);

  // ── Helpers ────────────────────────────────────────────────────────────
  function getIcon(tx: Transaction): string {
    const icons: Record<string, string> = {
      Income: '💼', Housing: '🏠', Groceries: '🛒', Transportation: '🚗',
      Utilities: '💡', Food: '🍔', Entertainment: '🎬', Shopping: '🛍️',
      Health: '🏥', Insurance: '🛡️', Savings: '💰', Transfer: '💸',
      Fees: '📄', deposit: '📥', withdrawal: '📤', fee: '📄',
    };
    return icons[tx.category ?? ''] || icons[tx.type] || (tx.amount >= 0 ? '📥' : '📤');
  }

  function getStatusColor(status: string) {
    return status === 'completed' ? 'text-green-700 bg-green-100'
         : status === 'pending'   ? 'text-amber-700 bg-amber-100'
         : 'text-red-700 bg-red-100';
  }

  // Use created_at from DB; fall back to legacy date field
  function txDate(tx: Transaction): string {
    return formatDate(tx.created_at || tx.date || '');
  }
</script>

<svelte:head>
  <title>Transactions - Trust Banque</title>
</svelte:head>

<div class="space-y-6">

  <!-- Header -->
  <div>
    <h1 class="text-3xl font-bold tracking-tight text-slate-900">Transaction History</h1>
    <p class="mt-1 text-slate-600">View and search your complete transaction history.</p>
  </div>

  <!-- Summary cards -->
  {#if !loading && transactions.length > 0}
  <div class="grid grid-cols-3 gap-4">
    <div class="rounded-2xl bg-white border border-slate-100 p-5 shadow-sm">
      <p class="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">Transactions</p>
      <p class="text-2xl font-bold text-slate-900">{filtered.length}</p>
    </div>
    <div class="rounded-2xl bg-white border border-slate-100 p-5 shadow-sm">
      <p class="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">Money In</p>
      <p class="text-2xl font-bold text-green-600">+{formatCurrency(totalCredit)}</p>
    </div>
    <div class="rounded-2xl bg-white border border-slate-100 p-5 shadow-sm">
      <p class="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">Money Out</p>
      <p class="text-2xl font-bold text-slate-900">{formatCurrency(totalDebit)}</p>
    </div>
  </div>
  {/if}

  <!-- Filters -->
  <div class="flex flex-wrap gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">

    <input
      type="text"
      bind:value={searchQuery}
      placeholder="Search by description, merchant…"
      class="min-w-[200px] flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
    />

    <!-- Account filter -->
    {#if accounts.length > 1}
    <select
      bind:value={selectedAccountId}
      onchange={loadTransactions}
      class="rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none"
    >
      <option value="">All Accounts</option>
      {#each accounts as acc}
        <option value={acc.id}>{acc.nickname || acc.account_type}</option>
      {/each}
    </select>
    {/if}

    <select
      bind:value={filterType}
      class="rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none"
    >
      <option value="all">All Types</option>
      <option value="deposit">Deposits</option>
      <option value="payment">Payments</option>
      <option value="withdrawal">Withdrawals</option>
      <option value="transfer">Transfers</option>
      <option value="fee">Fees</option>
    </select>

    <select
      bind:value={selectedCategory}
      class="rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none"
    >
      {#each categories as cat}
        <option value={cat}>{cat}</option>
      {/each}
    </select>
  </div>

  <!-- Transaction list -->
  <div class="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">

    {#if loading}
      <div class="flex items-center justify-center py-24"><LoadingSpinner size="lg" /></div>

    {:else if filtered.length === 0}
      <div class="py-20 text-center">
        <p class="text-4xl mb-3">💳</p>
        <p class="font-medium text-slate-700">No transactions found</p>
        <p class="text-sm text-slate-400 mt-1">
          {transactions.length === 0 ? 'Your transaction history will appear here.' : 'Try adjusting your filters.'}
        </p>
      </div>

    {:else}
      <div class="divide-y divide-slate-50">
        {#each filtered as tx}
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <div
            class="flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-slate-50 transition-colors"
            onclick={() => selectedTx = selectedTx?.id === tx.id ? null : tx}
          >
            <div class="flex items-center gap-4">
              <!-- Icon -->
              <div class="flex h-11 w-11 items-center justify-center rounded-2xl text-xl {tx.amount >= 0 ? 'bg-green-100' : 'bg-slate-100'}">
                {getIcon(tx)}
              </div>
              <!-- Description -->
              <div>
                <p class="text-sm font-semibold text-slate-900">{tx.description}</p>
                <p class="text-xs text-slate-400 mt-0.5">
                  {tx.merchant || tx.type}
                  {#if tx.category} · {tx.category}{/if}
                  · {txDate(tx)}
                </p>
              </div>
            </div>

            <div class="text-right">
              <p class="font-bold {tx.amount >= 0 ? 'text-green-600' : 'text-slate-900'}">
                {tx.amount >= 0 ? '+' : ''}{formatCurrency(tx.amount)}
              </p>
              <span class="mt-0.5 inline-block rounded-full px-2 py-0.5 text-xs font-medium {getStatusColor(tx.status)}">
                {tx.status}
              </span>
            </div>
          </div>

          <!-- Expanded detail row -->
          {#if selectedTx?.id === tx.id}
            <div class="bg-slate-50 px-6 py-4 border-t border-slate-100 text-sm text-slate-600 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p class="text-xs font-medium text-slate-400 uppercase mb-1">Balance After</p>
                <p class="font-semibold text-slate-900">{formatCurrency(tx.balance_after)}</p>
              </div>
              {#if tx.reference_number}
              <div>
                <p class="text-xs font-medium text-slate-400 uppercase mb-1">Reference</p>
                <p class="font-mono text-xs">{tx.reference_number}</p>
              </div>
              {/if}
              <div>
                <p class="text-xs font-medium text-slate-400 uppercase mb-1">Type</p>
                <p class="capitalize font-medium">{tx.type}</p>
              </div>
              <div>
                <p class="text-xs font-medium text-slate-400 uppercase mb-1">Status</p>
                <span class="inline-block rounded-full px-2 py-0.5 text-xs font-semibold capitalize {getStatusColor(tx.status)}">{tx.status}</span>
              </div>
            </div>
          {/if}
        {/each}
      </div>
    {/if}
  </div>

</div>

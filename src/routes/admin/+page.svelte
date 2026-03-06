<script lang="ts">
  import { onMount } from 'svelte';
  import { apiRequest } from '$lib/api/client';
  import { formatCurrency, formatDate } from '$lib/utils/formatters';
  import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';

  let loading = true;
  let stats: any = {};
  let recentUsers: any[] = [];
  let recentTx: any[] = [];

  onMount(async () => {
    const res = await apiRequest<any>('/admin/dashboard.php');
    loading = false;
    if (res.success && res.data) {
      stats = res.data.stats;
      recentUsers = res.data.recent_users;
      recentTx = res.data.recent_transactions;
    }
  });

  function statusColor(s: string) {
    return s === 'active' ? 'bg-emerald-100 text-emerald-700'
         : s === 'pending' ? 'bg-amber-100 text-amber-700'
         : s === 'flagged' ? 'bg-red-100 text-red-700'
         : 'bg-slate-100 text-slate-700';
  }
</script>

<svelte:head><title>Admin Overview — Trust Banque</title></svelte:head>

{#if loading}
  <div class="flex items-center justify-center py-32"><LoadingSpinner size="lg" /></div>
{:else}
<div class="space-y-8">

  <div>
    <h1 class="text-2xl font-bold text-slate-900">Admin Overview</h1>
    <p class="mt-1 text-slate-500">Live data from your database.</p>
  </div>

  <!-- Stat cards -->
  <div class="grid grid-cols-2 lg:grid-cols-4 gap-5">
    {#each [
      ['👥', 'Total Users', stats.total_users ?? 0, '', 'slate'],
      ['✅', 'Active Users', stats.active_users ?? 0, '', 'emerald'],
      ['💰', 'Total Assets', formatCurrency(stats.total_balance ?? 0), '', 'blue'],
      ['📋', "Today's Txns", stats.today_transactions ?? 0, '', 'purple'],
    ] as [icon, label, value, sub, color]}
      <div class="rounded-2xl bg-white border border-slate-100 p-6 shadow-sm">
        <div class="flex items-center justify-between mb-3">
          <span class="text-2xl">{icon}</span>
          <span class="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</span>
        </div>
        <p class="text-2xl font-bold text-slate-900">{value}</p>
      </div>
    {/each}
  </div>

  <!-- Second row stats -->
  <div class="grid grid-cols-2 lg:grid-cols-4 gap-5">
    {#each [
      ['⏳', 'Pending', stats.pending_users ?? 0],
      ['🚫', 'Suspended', stats.suspended_users ?? 0],
      ['📥', 'New Today', stats.new_users_today ?? 0],
      ['💸', "Today's Volume", formatCurrency(stats.today_volume ?? 0)],
    ] as [icon, label, value]}
      <div class="rounded-2xl bg-white border border-slate-100 p-5 shadow-sm">
        <p class="text-xs font-medium text-slate-400 mb-1">{icon} {label}</p>
        <p class="text-xl font-bold text-slate-900">{value}</p>
      </div>
    {/each}
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">

    <!-- Recent users -->
    <div class="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
      <div class="flex items-center justify-between border-b border-slate-100 px-6 py-4">
        <h2 class="font-bold text-slate-900">Recent Users</h2>
        <a href="/admin/users" class="text-sm font-medium text-red-500 hover:underline">Manage →</a>
      </div>
      {#if recentUsers.length === 0}
        <p class="px-6 py-8 text-center text-sm text-slate-500">No users yet.</p>
      {:else}
        <div class="divide-y divide-slate-50">
          {#each recentUsers as u}
            <a href="/admin/users/{u.id}" class="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors">
              <div class="flex items-center gap-3">
                <div class="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-sm font-bold text-white">
                  {u.first_name[0]}{u.last_name[0]}
                </div>
                <div>
                  <p class="text-sm font-semibold text-slate-900">{u.first_name} {u.last_name}</p>
                  <p class="text-xs text-slate-400">{u.email}</p>
                </div>
              </div>
              <div class="text-right">
                <p class="text-sm font-bold text-slate-900">{formatCurrency(parseFloat(u.total_balance))}</p>
                <span class="inline-block rounded-full px-2 py-0.5 text-xs font-semibold capitalize {statusColor(u.status)}">{u.status}</span>
              </div>
            </a>
          {/each}
        </div>
      {/if}
    </div>

    <!-- Recent transactions -->
    <div class="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
      <div class="flex items-center justify-between border-b border-slate-100 px-6 py-4">
        <h2 class="font-bold text-slate-900">Recent Transactions</h2>
        <a href="/admin/transactions" class="text-sm font-medium text-red-500 hover:underline">View all →</a>
      </div>
      {#if recentTx.length === 0}
        <p class="px-6 py-8 text-center text-sm text-slate-500">No transactions yet.</p>
      {:else}
        <div class="divide-y divide-slate-50">
          {#each recentTx as tx}
            <div class="flex items-center justify-between px-6 py-3.5">
              <div>
                <p class="text-sm font-semibold text-slate-900">{tx.description}</p>
                <p class="text-xs text-slate-400">{tx.first_name} {tx.last_name} · {formatDate(tx.created_at)}</p>
              </div>
              <span class="font-bold text-sm {tx.amount >= 0 ? 'text-green-600' : 'text-slate-700'}">
                {tx.amount >= 0 ? '+' : ''}{formatCurrency(tx.amount)}
              </span>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </div>

  <!-- Quick links -->
  <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
    {#each [['/admin/users','👥','Users'],['/admin/transactions','📋','Transactions'],['/admin/users','➕','Create User'],['/admin/users','🔍','Search']] as [href,icon,label]}
      <a {href} class="flex flex-col items-center gap-2 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm hover:border-red-200 hover:shadow-md transition-all">
        <span class="text-2xl">{icon}</span>
        <span class="text-sm font-medium text-slate-700">{label}</span>
      </a>
    {/each}
  </div>
</div>
{/if}

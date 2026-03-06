<script lang="ts">
  // src/routes/admin/logs/+page.svelte
  // Displays admin action logs, security events, and error log lines.
  // Tabs switch between the three log types.

  import { onMount }     from 'svelte';
  import { getAdminLogs } from '$lib/api/client';
  import { formatDate }  from '$lib/utils/formatters';
  import { toast }       from '$lib/stores/toast';
  import LoadingSpinner  from '$lib/components/LoadingSpinner.svelte';

  type Tab = 'admin' | 'security' | 'error';

  let activeTab: Tab = 'admin';
  let loading    = true;
  let logs: any[]   = [];
  let total      = 0;
  let page       = 1;
  const limit    = 50;

  onMount(() => fetchLogs());

  async function fetchLogs() {
    loading = true;
    const res = await getAdminLogs(activeTab, page, limit);
    loading = false;

    if (res.success && res.data) {
      logs  = (res.data as any).logs  ?? [];
      total = (res.data as any).total ?? 0;
    } else {
      toast.error('Failed to load logs');
      logs = [];
    }
  }

  function switchTab(tab: Tab) {
    activeTab = tab;
    page = 1;
    fetchLogs();
  }

  function riskColor(level: string) {
    return level === 'critical' ? 'bg-red-100 text-red-800'
         : level === 'high'     ? 'bg-orange-100 text-orange-800'
         : level === 'medium'   ? 'bg-amber-100 text-amber-800'
         : 'bg-slate-100 text-slate-600';
  }

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'admin',    label: 'Admin Actions', icon: '📋' },
    { id: 'security', label: 'Security',      icon: '🔐' },
    { id: 'error',    label: 'Error Log',     icon: '⚠️'  },
  ];
</script>

<svelte:head>
  <title>Activity Logs — Trust Banque Admin</title>
</svelte:head>

<div class="space-y-6">

  <div>
    <h1 class="text-2xl font-bold text-slate-900">Activity Logs</h1>
    <p class="mt-1 text-slate-500">Monitor system activity, security events, and errors.</p>
  </div>

  <!-- Tabs -->
  <div class="flex gap-1 rounded-2xl border border-slate-100 bg-white p-1.5 shadow-sm w-fit">
    {#each tabs as tab}
      <button
        onclick={() => switchTab(tab.id)}
        class="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all
          {activeTab === tab.id
            ? 'bg-slate-900 text-white shadow'
            : 'text-slate-600 hover:bg-slate-50'}"
      >
        <span>{tab.icon}</span> {tab.label}
      </button>
    {/each}
  </div>

  <!-- Log content -->
  <div class="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">

    {#if loading}
      <div class="flex items-center justify-center py-20"><LoadingSpinner size="lg" /></div>

    {:else if logs.length === 0}
      <div class="py-20 text-center">
        <p class="text-3xl mb-3">📋</p>
        <p class="text-slate-500">No log entries found</p>
      </div>

    <!-- Admin action logs -->
    {:else if activeTab === 'admin'}
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-slate-50 border-b border-slate-100">
            <tr>
              {#each ['Admin','Action','Target User','Details','When'] as h}
                <th class="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">{h}</th>
              {/each}
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50 text-sm">
            {#each logs as log}
              <tr class="hover:bg-slate-50">
                <td class="px-5 py-3.5">
                  <p class="font-medium text-slate-900">{log.admin_first_name} {log.admin_last_name}</p>
                  <p class="text-xs text-slate-400">{log.admin_email}</p>
                </td>
                <td class="px-5 py-3.5">
                  <span class="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                    {log.action}
                  </span>
                </td>
                <td class="px-5 py-3.5 text-slate-600">
                  {#if log.target_first_name}
                    {log.target_first_name} {log.target_last_name}
                  {:else}
                    <span class="text-slate-400">—</span>
                  {/if}
                </td>
                <td class="px-5 py-3.5 text-slate-500 max-w-[200px] truncate">{log.new_values || '—'}</td>
                <td class="px-5 py-3.5 text-slate-400 text-xs whitespace-nowrap">{formatDate(log.created_at)}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>

    <!-- Security logs -->
    {:else if activeTab === 'security'}
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-slate-50 border-b border-slate-100">
            <tr>
              {#each ['User','Event','Description','IP Address','Risk','When'] as h}
                <th class="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">{h}</th>
              {/each}
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50 text-sm">
            {#each logs as log}
              <tr class="hover:bg-slate-50">
                <td class="px-5 py-3.5">
                  {#if log.first_name}
                    <p class="font-medium text-slate-900">{log.first_name} {log.last_name}</p>
                    <p class="text-xs text-slate-400">{log.email}</p>
                  {:else}
                    <span class="text-slate-400">Anonymous</span>
                  {/if}
                </td>
                <td class="px-5 py-3.5">
                  <span class="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 capitalize">
                    {log.event_type?.replace('_', ' ')}
                  </span>
                </td>
                <td class="px-5 py-3.5 text-slate-600 max-w-[200px] truncate">{log.event_description || '—'}</td>
                <td class="px-5 py-3.5 font-mono text-xs text-slate-500">{log.ip_address || '—'}</td>
                <td class="px-5 py-3.5">
                  <span class="rounded-full px-2.5 py-1 text-xs font-semibold capitalize {riskColor(log.risk_level)}">
                    {log.risk_level}
                  </span>
                </td>
                <td class="px-5 py-3.5 text-slate-400 text-xs whitespace-nowrap">{formatDate(log.created_at)}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>

    <!-- Error log lines -->
    {:else}
      <div class="p-4 bg-slate-900 rounded-b-2xl">
        <div class="space-y-1">
          {#each logs as line, i}
            <p class="font-mono text-xs text-slate-300 py-0.5 border-b border-slate-800">
              <span class="text-slate-500 mr-3">{i + 1}</span>{line}
            </p>
          {:else}
            <p class="text-slate-500 text-sm text-center py-8">Error log is empty.</p>
          {/each}
        </div>
      </div>
    {/if}

  </div>

  <!-- Pagination -->
  {#if !loading && total > limit}
  <div class="flex items-center justify-between text-sm text-slate-500">
    <p>Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}</p>
    <div class="flex gap-2">
      <button
        onclick={() => { page--; fetchLogs(); }}
        disabled={page <= 1}
        class="rounded-xl border border-slate-200 px-4 py-2 hover:bg-slate-50 disabled:opacity-40 transition-colors"
      >← Prev</button>
      <button
        onclick={() => { page++; fetchLogs(); }}
        disabled={page * limit >= total}
        class="rounded-xl border border-slate-200 px-4 py-2 hover:bg-slate-50 disabled:opacity-40 transition-colors"
      >Next →</button>
    </div>
  </div>
  {/if}

</div>

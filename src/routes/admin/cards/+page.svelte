<script lang="ts">
  // src/routes/admin/cards/+page.svelte
  // Admin view of all cards across all users.
  // Admin can lock / unlock any card.

  import { onMount }  from 'svelte';
  import { getAdminCards, lockCard } from '$lib/api/client';
  import { formatCurrency, formatDate } from '$lib/utils/formatters';
  import { toast }    from '$lib/stores/toast';
  import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';

  let loading    = true;
  let cards: any[] = [];
  let searchQ    = '';
  let statusFilter = 'all';
  let togglingId: number | null = null;

  onMount(async () => {
    const res = await getAdminCards();
    loading = false;
    if (res.success && res.data) {
      cards = (res.data as any).cards ?? [];
    } else {
      toast.error('Failed to load cards');
    }
  });

  async function handleToggle(card: any) {
    const wantLocked = card.status === 'active';
    togglingId = card.id;
    const res = await lockCard(card.id, wantLocked);
    togglingId = null;

    if (res.success) {
      card.status = wantLocked ? 'locked' : 'active';
      cards = [...cards];
      toast.success(wantLocked ? `Card ****${card.card_number_masked.slice(-4)} locked` : 'Card unlocked');
    } else {
      toast.error(res.error || 'Failed to update card');
    }
  }

  $: filtered = cards.filter(c => {
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    if (searchQ) {
      const q = searchQ.toLowerCase();
      return (
        `${c.first_name} ${c.last_name}`.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.card_number_masked?.includes(q)
      );
    }
    return true;
  });

  function statusColor(s: string) {
    return s === 'active'        ? 'bg-emerald-100 text-emerald-700'
         : s === 'locked'        ? 'bg-amber-100 text-amber-700'
         : 'bg-red-100 text-red-700';
  }
</script>

<svelte:head>
  <title>Card Management — Trust Banque Admin</title>
</svelte:head>

<div class="space-y-6">

  <div>
    <h1 class="text-2xl font-bold text-slate-900">Card Management</h1>
    <p class="mt-1 text-slate-500">{cards.length} cards on file across all customers</p>
  </div>

  <!-- Filters -->
  <div class="flex flex-wrap gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
    <input
      type="text"
      bind:value={searchQ}
      placeholder="Search by name, email, card number…"
      class="min-w-[200px] flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-red-500 focus:ring-2 focus:ring-red-500/20 focus:outline-none"
    />
    <select
      bind:value={statusFilter}
      class="rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-red-500 focus:outline-none"
    >
      <option value="all">All Statuses</option>
      <option value="active">Active</option>
      <option value="locked">Locked</option>
      <option value="reported_lost">Reported Lost</option>
    </select>
  </div>

  <!-- Table -->
  <div class="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
    {#if loading}
      <div class="flex items-center justify-center py-20"><LoadingSpinner size="lg" /></div>
    {:else if filtered.length === 0}
      <div class="py-16 text-center">
        <p class="text-3xl mb-3">💳</p>
        <p class="text-slate-500">No cards found</p>
      </div>
    {:else}
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-slate-50 border-b border-slate-100">
            <tr>
              {#each ['Cardholder','Card Number','Type / Network','Linked Account','Daily Limit','Status','Actions'] as h}
                <th class="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">{h}</th>
              {/each}
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50">
            {#each filtered as card}
              <tr class="hover:bg-slate-50 transition-colors">
                <td class="px-5 py-4">
                  <a href="/admin/users/{card.user_id}" class="font-semibold text-sm text-slate-900 hover:text-red-600 hover:underline">
                    {card.first_name} {card.last_name}
                  </a>
                  <p class="text-xs text-slate-400">{card.email}</p>
                </td>
                <td class="px-5 py-4 font-mono text-sm text-slate-700">{card.card_number_masked}</td>
                <td class="px-5 py-4">
                  <span class="capitalize text-sm text-slate-600">{card.card_type}</span>
                  <span class="mx-1 text-slate-300">·</span>
                  <span class="capitalize text-sm text-slate-500">{card.card_network}</span>
                  <p class="text-xs text-slate-400 mt-0.5">Exp {card.expiry_date}</p>
                </td>
                <td class="px-5 py-4 text-sm text-slate-600">{card.account_nickname || card.account_type}</td>
                <td class="px-5 py-4 text-sm font-semibold text-slate-900">{formatCurrency(card.daily_limit)}</td>
                <td class="px-5 py-4">
                  <span class="rounded-full px-2.5 py-1 text-xs font-semibold capitalize {statusColor(card.status)}">
                    {card.status}
                  </span>
                </td>
                <td class="px-5 py-4">
                  {#if card.status !== 'reported_lost'}
                    <button
                      onclick={() => handleToggle(card)}
                      disabled={togglingId === card.id}
                      class="text-xs font-semibold {card.status === 'active' ? 'text-amber-600 hover:underline' : 'text-emerald-600 hover:underline'} disabled:opacity-50"
                    >
                      {#if togglingId === card.id}
                        …
                      {:else if card.status === 'active'}
                        Lock
                      {:else}
                        Unlock
                      {/if}
                    </button>
                  {:else}
                    <span class="text-xs text-slate-400">Reported Lost</span>
                  {/if}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </div>

</div>

<script lang="ts">
  // src/routes/dashboard/cards/+page.svelte
  // Displays the user's debit/credit cards fetched from the API.
  // Supports locking/unlocking cards and viewing card details.

  import { onMount }   from 'svelte';
  import { getCards, lockCard } from '$lib/api/client';
  import { formatCurrency, formatDate } from '$lib/utils/formatters';
  import { toast }     from '$lib/stores/toast';
  import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
  import type { Card }  from '$lib/types';

  let loading = true;
  let cards: Card[] = [];
  let togglingId: number | null = null;  // which card is currently toggling

  onMount(async () => {
    const res = await getCards();
    loading = false;
    if (res.success && res.data) {
      cards = (res.data as any).cards ?? [];
    } else {
      toast.error('Could not load your cards');
    }
  });

  // ── Lock / Unlock ─────────────────────────────────────────────────────
  async function handleToggleLock(card: Card) {
    const wantLocked = card.status === 'active';
    togglingId = card.id;

    const res = await lockCard(card.id, wantLocked);
    togglingId = null;

    if (res.success) {
      card.status = wantLocked ? 'locked' : 'active';
      cards = [...cards]; // trigger reactivity
      toast.success(wantLocked ? 'Card locked' : 'Card unlocked');
    } else {
      toast.error(res.error || 'Failed to update card');
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────
  function networkLogo(network: string): string {
    return network === 'visa' ? '💳 VISA' : '💳 MC';
  }

  function cardBg(network: string): string {
    return network === 'visa'
      ? 'from-slate-800 to-slate-900'
      : 'from-red-700 to-red-900';
  }

  function statusColor(status: string): string {
    return status === 'active'        ? 'bg-green-100 text-green-700'
         : status === 'locked'        ? 'bg-amber-100 text-amber-700'
         : 'bg-red-100 text-red-700';
  }
</script>

<svelte:head>
  <title>Cards - Trust Banque</title>
</svelte:head>

<div class="space-y-8">

  <!-- Header -->
  <div>
    <h1 class="text-3xl font-bold tracking-tight text-slate-900">Your Cards</h1>
    <p class="mt-1 text-slate-600">Manage your debit and credit cards.</p>
  </div>

  {#if loading}
    <div class="flex items-center justify-center py-32"><LoadingSpinner size="lg" /></div>

  {:else if cards.length === 0}
    <div class="rounded-2xl border border-slate-100 bg-white p-12 text-center shadow-sm">
      <p class="text-5xl mb-4">💳</p>
      <p class="font-semibold text-slate-700">No cards on file</p>
      <p class="text-sm text-slate-400 mt-1">Your cards will appear here once issued.</p>
    </div>

  {:else}

  <!-- Card Grid -->
  <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
    {#each cards as card}
      <div class="space-y-4">

        <!-- Visual Card -->
        <div class="relative rounded-3xl bg-gradient-to-br {cardBg(card.card_network)} p-6 text-white shadow-2xl min-h-[200px] overflow-hidden
                    {card.status === 'locked' ? 'opacity-70' : ''}">
          <!-- Background pattern -->
          <div class="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/5"></div>
          <div class="absolute -left-4 -bottom-8 h-32 w-32 rounded-full bg-white/5"></div>

          <!-- Chip + Network -->
          <div class="flex items-start justify-between mb-6">
            <div class="w-12 h-9 rounded-md bg-amber-300/80 flex items-center justify-center">
              <div class="w-8 h-6 rounded border-2 border-amber-500/50 grid grid-cols-2 gap-0.5 p-0.5">
                <div class="bg-amber-400/50 rounded-sm"></div>
                <div class="bg-amber-400/50 rounded-sm"></div>
                <div class="bg-amber-400/50 rounded-sm"></div>
                <div class="bg-amber-400/50 rounded-sm"></div>
              </div>
            </div>
            <div class="text-right">
              <p class="text-xs text-white/60 uppercase tracking-widest">
                {card.card_network === 'visa' ? 'VISA' : 'MASTERCARD'}
              </p>
              {#if card.status !== 'active'}
                <span class="mt-1 inline-block rounded-full bg-red-500/80 px-2 py-0.5 text-xs font-bold">
                  🔒 {card.status.toUpperCase()}
                </span>
              {/if}
            </div>
          </div>

          <!-- Card Number -->
          <p class="font-mono text-xl tracking-widest mb-4">{card.card_number_masked}</p>

          <!-- Name + Expiry -->
          <div class="flex items-end justify-between">
            <div>
              <p class="text-xs text-white/50 mb-1">CARDHOLDER</p>
              <p class="font-semibold tracking-wider">{card.cardholder_name}</p>
            </div>
            <div class="text-right">
              <p class="text-xs text-white/50 mb-1">EXPIRES</p>
              <p class="font-semibold">{card.expiry_date}</p>
            </div>
          </div>
        </div>

        <!-- Card Info Panel -->
        <div class="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm space-y-4">

          <!-- Status + Type -->
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-bold text-slate-900 capitalize">{card.account_nickname || card.account_type} Card</p>
              <p class="text-xs text-slate-400 mt-0.5 capitalize">{card.card_type} · {card.card_network}</p>
            </div>
            <span class="rounded-full px-2.5 py-1 text-xs font-semibold capitalize {statusColor(card.status)}">
              {card.status}
            </span>
          </div>

          <!-- Limits -->
          <div class="grid grid-cols-2 gap-3 text-sm">
            <div class="rounded-xl bg-slate-50 p-3">
              <p class="text-xs text-slate-400 mb-1">Daily Limit</p>
              <p class="font-bold text-slate-900">{formatCurrency(card.daily_limit)}</p>
            </div>
            <div class="rounded-xl bg-slate-50 p-3">
              <p class="text-xs text-slate-400 mb-1">Monthly Limit</p>
              <p class="font-bold text-slate-900">{formatCurrency(card.monthly_limit)}</p>
            </div>
          </div>

          <!-- Linked Account -->
          {#if card.account_nickname}
          <div class="flex items-center gap-3 rounded-xl bg-emerald-50 border border-emerald-100 p-3">
            <span class="text-lg">🏦</span>
            <div>
              <p class="text-xs text-emerald-600 font-medium">Linked Account</p>
              <p class="text-sm font-semibold text-slate-900">{card.account_nickname}</p>
            </div>
          </div>
          {/if}

          <!-- Lock / Unlock -->
          {#if card.status !== 'reported_lost'}
          <button
            onclick={() => handleToggleLock(card)}
            disabled={togglingId === card.id}
            class="flex w-full items-center justify-center gap-2 rounded-xl border py-3 text-sm font-semibold transition-all
              {card.status === 'active'
                ? 'border-amber-200 text-amber-700 hover:bg-amber-50'
                : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'}
              disabled:opacity-50"
          >
            {#if togglingId === card.id}
              <LoadingSpinner size="sm" />
              Processing…
            {:else if card.status === 'active'}
              🔒 Lock Card
            {:else}
              🔓 Unlock Card
            {/if}
          </button>
          {/if}

          <!-- Report Lost (info only — would need extra endpoint in production) -->
          {#if card.status !== 'reported_lost'}
          <button
            onclick={() => toast.info('Please call 1-800-TRUST-BQ to report a lost card.')}
            class="w-full rounded-xl border border-red-200 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            🚨 Report Lost / Stolen
          </button>
          {/if}

        </div>
      </div>
    {/each}
  </div>

  <!-- Security info -->
  <div class="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
    <h3 class="font-bold text-slate-900 mb-4">💡 Card Security Tips</h3>
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-slate-600">
      <div class="flex items-start gap-3">
        <span class="text-2xl">🔒</span>
        <p>Lock your card instantly if you suspect unauthorised use — it can be unlocked just as easily.</p>
      </div>
      <div class="flex items-start gap-3">
        <span class="text-2xl">🌐</span>
        <p>Never share your full card number, CVV, or PIN with anyone, including bank staff.</p>
      </div>
      <div class="flex items-start gap-3">
        <span class="text-2xl">📱</span>
        <p>Enable transaction alerts in Settings so you're notified of every charge in real time.</p>
      </div>
    </div>
  </div>

  {/if}
</div>

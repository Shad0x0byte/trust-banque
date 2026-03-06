<script lang="ts">
  // src/routes/signup/+page.svelte
  // Step 1 of the signup flow — let the user choose an account type.
  // The choice is saved to the signup store before navigating to step 2.

  import { goto }   from '$app/navigation';
  import { signup } from '$lib/stores/signup';
  import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';

  let selectedAccount = '';
  let isLoading = false;

  const accountTypes = [
    {
      id:          'checking',
      name:        'Personal Checking',
      icon:        '💳',
      description: 'Everyday banking with no monthly fees',
      features:    ['No monthly maintenance fee','Free debit card','Mobile check deposit','55,000+ fee-free ATMs'],
      apy:         '0.01%',
      recommended: true,
    },
    {
      id:          'savings',
      name:        'High-Yield Savings',
      icon:        '💰',
      description: 'Grow your money with competitive rates',
      features:    ['2.50% APY','No minimum balance','Automatic transfers','FDIC insured'],
      apy:         '2.50%',
      recommended: false,
    },
    {
      id:          'both',
      name:        'Checking + Savings',
      icon:        '🏦',
      description: 'Complete banking solution with the best of both',
      features:    ['All checking features','All savings features','Relationship bonuses','Priority support'],
      apy:         '2.50%',
      recommended: false,
    },
  ];

  function handleContinue() {
    if (!selectedAccount) return;

    // ── Save account type to the signup store BEFORE navigating ──────────
    // This was previously missing, causing the selection to be lost.
    signup.save({ accountType: selectedAccount });

    isLoading = true;
    setTimeout(() => goto('/signup/personal'), 300);
  }
</script>

<svelte:head>
  <title>Open Account - Trust Banque</title>
</svelte:head>

<div class="min-h-screen bg-slate-50">
  <!-- Header with progress -->
  <header class="bg-white border-b border-slate-200">
    <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <a href="/" class="flex items-center gap-2 mb-6">
        <div class="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
          <span class="text-lg">🏦</span>
        </div>
        <span class="font-bold text-lg text-slate-900">Trust Banque</span>
      </a>
      <!-- Progress Steps -->
      <div class="flex items-center">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">1</div>
          <span class="text-sm font-semibold text-slate-900">Choose Account</span>
        </div>
        <div class="flex-1 mx-4 h-0.5 bg-slate-200"><div class="h-0.5 bg-emerald-600 w-0"></div></div>
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-sm">2</div>
          <span class="text-sm text-slate-400">Personal Info</span>
        </div>
        <div class="flex-1 mx-4 h-0.5 bg-slate-200"></div>
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-sm">3</div>
          <span class="text-sm text-slate-400">Verify</span>
        </div>
      </div>
    </div>
  </header>

  <main class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
    <div class="text-center mb-8">
      <h1 class="text-3xl font-bold text-slate-900">Choose Your Account</h1>
      <p class="text-slate-600 mt-2">Select the account type that best fits your needs</p>
    </div>

    <div class="space-y-4">
      {#each accountTypes as account}
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <div
          class="relative bg-white rounded-2xl border-2 {selectedAccount === account.id ? 'border-emerald-500 shadow-lg' : 'border-slate-200'} p-6 cursor-pointer hover:border-emerald-400 transition-all"
          onclick={() => (selectedAccount = account.id)}
        >
          {#if account.recommended}
            <div class="absolute -top-3 left-6 bg-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-full">
              MOST POPULAR
            </div>
          {/if}

          <div class="flex items-start gap-4">
            <div class="text-4xl">{account.icon}</div>
            <div class="flex-1">
              <div class="flex items-center justify-between">
                <h3 class="text-lg font-bold text-slate-900">{account.name}</h3>
                <span class="text-sm font-semibold text-emerald-600">{account.apy} APY</span>
              </div>
              <p class="text-slate-600 mt-1">{account.description}</p>
              <ul class="mt-3 space-y-1">
                {#each account.features as feature}
                  <li class="text-sm text-slate-500 flex items-center gap-2">
                    <span class="text-emerald-600">✓</span> {feature}
                  </li>
                {/each}
              </ul>
            </div>
            <!-- Radio indicator -->
            <div class="w-6 h-6 rounded-full border-2 {selectedAccount === account.id ? 'border-emerald-600 bg-emerald-600' : 'border-slate-300'} flex items-center justify-center flex-shrink-0 mt-1">
              {#if selectedAccount === account.id}
                <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
                </svg>
              {/if}
            </div>
          </div>
        </div>
      {/each}
    </div>

    <!-- Navigation -->
    <div class="mt-8 flex justify-between">
      <a href="/" class="flex items-center gap-2 rounded-xl border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
        ← Back to Home
      </a>
      <button
        onclick={handleContinue}
        disabled={!selectedAccount || isLoading}
        class="flex items-center gap-2 rounded-xl bg-emerald-600 px-8 py-3 text-sm font-semibold text-white shadow hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {#if isLoading}
          <LoadingSpinner size="sm" color="text-white" />
        {:else}
          Continue →
        {/if}
      </button>
    </div>

    <div class="mt-8 p-4 bg-slate-100 rounded-2xl">
      <p class="text-xs text-slate-600 text-center">
        🔒 Your information is protected with bank-level 256-bit encryption. Opening an account is free and takes about 10 minutes.
      </p>
    </div>
  </main>
</div>

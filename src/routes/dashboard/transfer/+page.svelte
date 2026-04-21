<script lang="ts">
  import { onMount }   from 'svelte';
  import { toast }     from '$lib/stores/toast';
  import { apiRequest, initiateInternalTransfer, initiateExternalTransfer, getAccounts } from '$lib/api/client';
  import { formatCurrency } from '$lib/utils/formatters';
  import LoadingSpinner    from '$lib/components/LoadingSpinner.svelte';
  import type { Account }  from '$lib/types';

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const US_BANKS = [
  { name: 'Bank of America', routing: '026009593' },
  { name: 'JPMorgan Chase', routing: '021000021' },
  { name: 'Wells Fargo', routing: '121042882' },
  { name: 'Citibank', routing: '021000089' },
  { name: 'U.S. Bancorp', routing: '091000022' },
  { name: 'Truist Bank', routing: '053101121' },
  { name: 'PNC Bank', routing: '043000096' },
  { name: 'Goldman Sachs', routing: '124085066' },
  { name: 'Capital One', routing: '051405515' },
  { name: 'TD Bank', routing: '031101266' },
  { name: 'Ally Bank', routing: '124003116' },
  { name: 'Discover Bank', routing: '031100649' },
  { name: 'Charles Schwab', routing: '121202211' },
  { name: 'Trust Banque', routing: '021000021' },
  { name: 'Other', routing: '' },
];

  const TRANSFER_PIN = '0419';

  let pageLoading = true;
  let accounts: Account[] = [];

  let transferData = {
    fromAccount: '', toAccount: '', toAccountExternal: '',
    toName: '', selectedBank: '', routingNumber: '',
    amount: '', transferType: 'internal' as 'internal' | 'external' | 'wire',
    note: '',
  };

  let isLoading = false;
  let showConfirmation = false;
  let confirmationData: typeof transferData | null = null;
  let pin = '';
  let pinError = false;
  let showPin = false;
  let recipientAccount: { id: number; account_type: string; recipient_name: string } | null = null;
  let lookingUpAccount = false;
  let showSuccessModal = false;
  let lastTransferResult: {
    reference_number: string;
    amount: number;
    from_account: string;
    from_account_number?: string;
    from_account_type?: string;
    to_account: string;
    from_balance: number;
    to_balance: number;
    date: string;
  } | null = null;

  onMount(async () => {
    const res = await apiRequest<any>('/user/profile.php');
    pageLoading = false;
    if (res.success && res.data) {
      accounts = res.data.accounts ?? [];
    } else {
      toast.error('Could not load your accounts');
    }
  });

  $: fromAccountId = transferData.fromAccount ? parseInt(transferData.fromAccount) : null;
  $: fromAccount   = accounts.find(a => a.id === fromAccountId);
  $: maxTransfer   = fromAccount?.available_balance ?? 0;

  function handleBankChange() {
    const val = transferData.selectedBank;
    const bank = US_BANKS.find(b => b.name === val);
    if (bank) transferData.routingNumber = bank.routing;
    if (val !== 'Trust Banque') {
      recipientAccount = null;
    } else {
      handleAccountNumberChange();
    }
  }

  async function handleAccountNumberChange() {
    const accountNum = transferData.toAccountExternal.replace(/\D/g, '');
    transferData.toAccountExternal = accountNum;

    if (!accountNum || accountNum.length < 8) {
      recipientAccount = null;
      return;
    }

    if (transferData.selectedBank === 'Trust Banque') {
      lookingUpAccount = true;
      try {
        const res = await apiRequest<any>(`/transfer/lookup_account.php?account_number=${encodeURIComponent(accountNum)}`);
        if (res.success && res.data?.found && res.data?.is_trustbanque) {
          recipientAccount = res.data.account;
          transferData.toName = res.data.account.recipient_name;
        } else {
          recipientAccount = null;
        }
      } catch {
        recipientAccount = null;
      } finally {
        lookingUpAccount = false;
      }
    }
  }

  function validateForm(): boolean {
    if (!transferData.fromAccount) { toast.error('Please select a source account'); return false; }
    if (transferData.transferType === 'internal' && !transferData.toAccount) { toast.error('Please select a destination account'); return false; }
    if (transferData.transferType !== 'internal' && !transferData.toAccountExternal) { toast.error('Please enter the recipient\'s account number'); return false; }
    if (transferData.transferType !== 'internal' && !transferData.toName) { toast.error('Please enter the recipient name'); return false; }
    if (transferData.transferType !== 'internal' && !transferData.selectedBank) { toast.error('Please select the recipient\'s bank'); return false; }
    const amount = parseFloat(transferData.amount);
    if (isNaN(amount) || amount <= 0) { toast.error('Please enter a valid amount'); return false; }
    if (amount > maxTransfer) { toast.error('Insufficient funds'); return false; }
    return true;
  }

  function handleReview() {
    if (!validateForm()) return;
    confirmationData = { ...transferData };
    pin = '';
    pinError = false;
    showConfirmation = true;
  }

  async function handleConfirm() {
    const data = confirmationData;
    if (!data) return;
    if (pin !== TRANSFER_PIN) {
      pinError = true;
      toast.error('Incorrect transaction PIN');
      return;
    }
    pinError = false;
    isLoading = true;

    try {
      let res: any;
      const amount = parseFloat(data.amount);

      const isTrustBanqueTransfer = data.selectedBank === 'Trust Banque' && recipientAccount;

      if (data.transferType === 'internal' || isTrustBanqueTransfer) {
        const toAccountId = isTrustBanqueTransfer ? recipientAccount!.id : parseInt(data.toAccount);
        res = await initiateInternalTransfer({
          from_account_id: parseInt(data.fromAccount),
          to_account_id: toAccountId,
          amount,
          note: data.note || undefined,
        });
      } else {
        res = await initiateExternalTransfer({
          from_account_id: parseInt(data.fromAccount),
          recipient_name: data.toName,
          recipient_bank: data.selectedBank,
          routing_number: data.routingNumber || undefined,
          account_number: data.toAccountExternal,
          amount,
          transfer_type: data.transferType as 'external' | 'wire',
          note: data.note || undefined,
        });
      }

      if (res.success) {
        toast.success('Transfer completed successfully!');
        showConfirmation = false;
        
        const fromAcc = accounts.find(a => String(a.id) === data.fromAccount);
        let toAccName = data.toName;
        if (isTrustBanqueTransfer && recipientAccount) {
          toAccName = recipientAccount.recipient_name;
        } else if (data.transferType === 'internal') {
          const toAcc = accounts.find(a => String(a.id) === data.toAccount);
          if (toAcc) toAccName = toAcc.nickname || toAcc.account_type;
        }

        lastTransferResult = {
          reference_number: res.data?.reference_number || 'N/A',
          amount: parseFloat(data.amount),
          from_account: fromAcc?.nickname || fromAcc?.account_type || 'Account',
          from_account_number: fromAcc?.account_number || '',
          from_account_type: fromAcc?.account_type || '',
          to_account: toAccName,
          from_balance: res.data?.from_balance ?? fromAcc?.available_balance ?? 0,
          to_balance: res.data?.to_balance ?? 0,
          date: new Date().toLocaleString()
        };
        showSuccessModal = true;

        // Reset form
        transferData = { fromAccount: '', toAccount: '', toAccountExternal: '', toName: '', selectedBank: '', routingNumber: '', amount: '', transferType: 'internal', note: '' };
        recipientAccount = null;
        
        // Refresh accounts
        const profileRes = await apiRequest<any>('/user/profile.php');
        if (profileRes.success && profileRes.data) accounts = profileRes.data.accounts ?? [];
      } else {
        toast.error(res.error || 'Transfer failed');
      }
    } catch {
      toast.error('An error occurred');
    } finally {
      isLoading = false;
    }
  }

  function closeSuccessModal() {
    showSuccessModal = false;
    lastTransferResult = null;
  }
</script>

<svelte:head><title>Transfer — Trust Banque</title></svelte:head>

{#if pageLoading}
  <div class="flex items-center justify-center py-32"><LoadingSpinner size="lg" /></div>
{:else}
<div class="fade-in">
  <div class="mb-6">
    <h1 class="font-display text-2xl font-semibold text-slate-900 sm:text-3xl">Send Money</h1>
    <p class="mt-1 text-sm text-slate-500">Transfers are secure and encrypted.</p>
  </div>

  <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
    <!-- Transfer form -->
    <div class="lg:col-span-2">
      <div class="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div class="border-b border-slate-100 px-5 py-4 sm:px-6">
          <h2 class="font-display text-base font-semibold text-slate-900">Transfer Details</h2>
        </div>
        <div class="space-y-5 p-5 sm:p-6">

          <!-- Transfer type tabs -->
          <div>
            <label class="mb-2 block text-sm font-semibold text-slate-700">Transfer Type</label>
            <div class="grid grid-cols-3 gap-2">
              {#each [['internal','↔ Internal'],['external','🏦 External'],['wire','⚡ Wire']] as [val, label]}
                <button type="button" on:click={() => transferData.transferType = val as any}
                  class="rounded-xl border py-2.5 text-xs font-semibold transition-all sm:text-sm
                  {transferData.transferType === val
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300'}">
                  {label}
                </button>
              {/each}
            </div>
          </div>

          <!-- From account -->
          <div>
            <label class="mb-2 block text-sm font-semibold text-slate-700">From Account</label>
            <select bind:value={transferData.fromAccount}
              class="block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none">
              <option value="">Select account</option>
              {#each accounts as acc}
                <option value={String(acc.id)}>
                  {acc.nickname || acc.account_type} — {formatCurrency(acc.balance)} (••••{acc.account_number.slice(-4)})
                </option>
              {/each}
            </select>
          </div>

          <!-- Internal: to account -->
          {#if transferData.transferType === 'internal'}
            <div>
              <label class="mb-2 block text-sm font-semibold text-slate-700">To Account</label>
              <select bind:value={transferData.toAccount}
                class="block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none">
                <option value="">Select destination</option>
                {#each accounts.filter(a => String(a.id) !== transferData.fromAccount) as acc}
                  <option value={String(acc.id)}>{acc.nickname || acc.account_type} (••••{acc.account_number.slice(-4)})</option>
                {/each}
              </select>
            </div>

          {:else}
            <!-- External/wire fields -->
            <div>
              <label class="mb-2 block text-sm font-semibold text-slate-700">Recipient Name</label>
              <input type="text" bind:value={transferData.toName} placeholder="Full name or company"
                class="block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none" />
            </div>
            <div>
              <label class="mb-2 block text-sm font-semibold text-slate-700">Recipient Bank</label>
              <select bind:value={transferData.selectedBank} on:change={handleBankChange}
                class="block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none">
                <option value="">Select bank</option>
                {#each US_BANKS as bank}
                  <option value={bank.name}>{bank.name}</option>
                {/each}
              </select>
            </div>
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label class="mb-2 block text-sm font-semibold text-slate-700">Account Number</label>
                <input type="text" bind:value={transferData.toAccountExternal} on:input={handleAccountNumberChange} placeholder="1234567890"
                  class="block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none" />
                {#if lookingUpAccount}
                  <span class="mt-1 text-xs text-slate-500">Looking up account...</span>
                {:else if recipientAccount}
                  <span class="mt-1 text-xs text-emerald-600 font-medium">✓ Found: {recipientAccount.recipient_name} ({recipientAccount.account_type})</span>
                {/if}
              </div>
              <div>
                <label class="mb-2 block text-sm font-semibold text-slate-700">Routing Number</label>
                <input type="text" bind:value={transferData.routingNumber} placeholder="Auto-filled"
                  class="block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none" />
              </div>
            </div>
          {/if}

          <!-- Amount -->
          <div>
            <label class="mb-2 block text-sm font-semibold text-slate-700">Amount</label>
            <div class="relative">
              <span class="absolute top-1/2 left-4 -translate-y-1/2 text-lg font-semibold text-slate-400">$</span>
              <input type="number" bind:value={transferData.amount} placeholder="0.00" step="0.01" min="0.01"
                class="block w-full rounded-xl border border-slate-200 bg-white py-3.5 pr-4 pl-10 text-xl font-bold text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none" />
            </div>
            {#if fromAccount}
              <p class="mt-1.5 text-sm text-slate-500">Available: <span class="font-semibold text-slate-700">{formatCurrency(maxTransfer)}</span></p>
            {/if}
          </div>

          <!-- Note -->
          <div>
            <label class="mb-2 block text-sm font-semibold text-slate-700">Note <span class="font-normal text-slate-400">(optional)</span></label>
            <textarea bind:value={transferData.note} placeholder="What's this for?" rows="2"
              class="block w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"></textarea>
          </div>

          <button type="button" on:click={handleReview}
            class="w-full rounded-xl bg-emerald-600 px-4 py-4 text-base font-bold text-white shadow-sm transition-all hover:bg-emerald-700 active:scale-[0.98]">
            Review Transfer →
          </button>
        </div>
      </div>
    </div>

    <!-- Info panel -->
    <div class="space-y-4">
      <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 class="font-display mb-3 text-sm font-semibold text-slate-900">Transfer Times</h3>
        <ul class="space-y-2.5 text-sm">
          <li class="flex items-start gap-2"><span class="font-bold text-emerald-600 mt-0.5">●</span><div><span class="font-semibold text-slate-900">Internal</span><p class="text-xs text-slate-500">Instant</p></div></li>
          <li class="flex items-start gap-2"><span class="font-bold text-blue-600 mt-0.5">●</span><div><span class="font-semibold text-slate-900">External</span><p class="text-xs text-slate-500">1–3 business days</p></div></li>
          <li class="flex items-start gap-2"><span class="font-bold text-purple-600 mt-0.5">●</span><div><span class="font-semibold text-slate-900">Wire</span><p class="text-xs text-slate-500">Same day (before 2 PM)</p></div></li>
        </ul>
      </div>
      <div class="rounded-2xl border border-slate-100 bg-slate-50 p-5">
        <div class="flex items-start gap-3">
          <span class="text-xl">🔒</span>
          <div>
            <p class="text-sm font-semibold text-slate-900">Secure Transfer</p>
            <p class="mt-0.5 text-xs text-slate-500">All transfers use 256-bit encryption and require your PIN.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
{/if}

<!-- Confirmation + PIN Modal -->
{#if showConfirmation && confirmationData}
  <div class="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-4">
    <div class="w-full max-w-md rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl sm:p-8">
      <div class="mb-5 text-center">
        <div class="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
          <span class="text-3xl">💸</span>
        </div>
        <h3 class="font-display text-xl font-semibold text-slate-900 sm:text-2xl">Confirm Transfer</h3>
        <p class="mt-1 text-sm text-slate-500">Review and enter your PIN to confirm</p>
      </div>

      <div class="mb-5 space-y-0 rounded-xl bg-slate-50 overflow-hidden">
        <div class="flex justify-between border-b border-slate-100 px-4 py-3">
          <span class="text-sm text-slate-500">From</span>
          <span class="text-sm font-semibold">{fromAccount?.nickname || 'Account'}</span>
        </div>
        <div class="flex justify-between border-b border-slate-100 px-4 py-3">
          <span class="text-sm text-slate-500">To</span>
          <span class="text-sm font-semibold text-right max-w-[55%]">
            {#if confirmationData.transferType === 'internal'}
              {accounts.find(a => String(a.id) === confirmationData?.toAccount)?.nickname || 'Account'}
            {:else if confirmationData.selectedBank === 'Trust Banque' && recipientAccount}
              {recipientAccount.recipient_name} (Trust Banque - {recipientAccount.account_type})
            {:else}
              {confirmationData.toName}
            {/if}
          </span>
        </div>
        <div class="flex justify-between border-b border-slate-100 px-4 py-3">
          <span class="text-sm text-slate-500">Amount</span>
          <span class="text-xl font-bold text-emerald-600">{formatCurrency(parseFloat(confirmationData.amount))}</span>
        </div>
        <div class="flex justify-between px-4 py-3">
          <span class="text-sm text-slate-500">Type</span>
          <span class="text-sm font-semibold capitalize">{confirmationData.transferType}</span>
        </div>
      </div>

      <!-- PIN entry -->
      <div class="mb-5">
        <label class="mb-1.5 block text-sm font-semibold text-slate-700">Transaction PIN</label>
        <div class="relative">
          <input
            type={showPin ? 'text' : 'password'}
            bind:value={pin}
            maxlength="4"
            placeholder="Enter 4-digit PIN"
            class="block w-full rounded-xl border px-4 py-3.5 text-center text-2xl font-bold tracking-[0.5em] transition-all focus:outline-none
            {pinError ? 'border-red-400 bg-red-50 text-red-700 focus:ring-2 focus:ring-red-500/20' : 'border-slate-200 bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'}"
          />
          <button type="button" on:click={() => showPin = !showPin}
            class="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400 hover:text-slate-600">
            {showPin ? 'Hide' : 'Show'}
          </button>
        </div>
        {#if pinError}
          <p class="mt-1.5 text-xs font-medium text-red-600">⚠ Incorrect PIN. Please try again.</p>
        {/if}
      </div>

      <div class="flex gap-3">
        <button on:click={() => (showConfirmation = false)}
          class="flex-1 rounded-xl border border-slate-200 px-4 py-3.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
          Cancel
        </button>
        <button on:click={handleConfirm} disabled={isLoading || pin.length !== 4}
          class="flex-1 flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed">
          {#if isLoading}
            <LoadingSpinner size="sm" color="text-white" />
            Processing…
          {:else}
            Confirm Transfer
          {/if}
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- Success Modal -->
{#if showSuccessModal && lastTransferResult}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
    <div class="w-full max-w-md animate-in fade-in zoom-in duration-300">
      <div class="overflow-hidden rounded-3xl bg-white shadow-2xl border border-slate-100">
        <!-- Receipt Header -->
        <div class="bg-emerald-600 px-6 py-8 text-center text-white relative">
          <div class="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
              <path d="M0 100 C 20 0 50 0 100 100 Z" fill="white"></path>
            </svg>
          </div>
          <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 shadow-inner">
            <span class="text-3xl">🏦</span>
          </div>
          <h2 class="text-xs font-bold uppercase tracking-widest opacity-80 mb-1">Trust Banque</h2>
          <h3 class="font-display text-2xl font-bold">Transfer Successful</h3>
          <p class="mt-2 text-sm text-emerald-50/80">Transaction Reference: <span class="font-mono font-bold">{lastTransferResult.reference_number}</span></p>
        </div>

        <!-- Receipt Body -->
        <div class="p-6 sm:p-8">
          <div class="mb-6 text-center">
            <p class="text-sm font-medium text-slate-400 uppercase tracking-wide mb-1">Amount Transferred</p>
            <p class="text-4xl font-extrabold text-slate-900 tracking-tight">{formatCurrency(lastTransferResult.amount)}</p>
          </div>

          <div class="space-y-4 rounded-2xl bg-slate-50 p-5 border border-slate-100">
            <div class="flex justify-between items-start gap-4">
              <span class="text-xs font-bold text-slate-400 uppercase mt-1">From</span>
              <div class="text-right">
                <p class="text-sm font-bold text-slate-900">{lastTransferResult.from_account}</p>
                <p class="text-[11px] font-mono text-slate-500 uppercase">•••• {lastTransferResult.from_account_number ? lastTransferResult.from_account_number.slice(-4) : 'XXXX'}</p>
                <p class="text-[10px] font-medium text-slate-400 uppercase tracking-tight">{lastTransferResult.from_account_type || 'Account'}</p>
              </div>
            </div>
            <div class="h-px bg-slate-200/60"></div>
            <div class="flex justify-between items-start gap-4">
              <span class="text-xs font-bold text-slate-400 uppercase">To Recipient</span>
              <span class="text-sm font-bold text-slate-900 text-right">{lastTransferResult.to_account}</span>
            </div>
            <div class="h-px bg-slate-200/60"></div>
            <div class="flex justify-between items-center">
              <span class="text-xs font-bold text-slate-400 uppercase">Date & Time</span>
              <span class="text-sm font-semibold text-slate-700">{lastTransferResult.date}</span>
            </div>
            <div class="h-px bg-slate-200/60"></div>
            <div class="flex justify-between items-center">
              <span class="text-xs font-bold text-slate-400 uppercase">Reference Code</span>
              <span class="text-sm font-mono font-bold text-emerald-600 uppercase tracking-wider">{lastTransferResult.reference_number}</span>
            </div>
          </div>

          <p class="mt-6 text-center text-[11px] text-slate-400 leading-relaxed italic">
            This is an official confirmation of your transaction. You can download the full receipt or take a screenshot for your records.
          </p>

          <div class="mt-8 flex flex-col gap-3">
            <button on:click={() => {
              if (lastTransferResult) {
                const token = localStorage.getItem('auth_token');
                const url = `${API_BASE}/receipts/generate.php?ref=${lastTransferResult.reference_number}${token ? `&_token=${encodeURIComponent(token)}` : ''}`;
                window.open(url, '_blank');
              }
            }}
              class="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-slate-200 hover:bg-slate-800 transition-all active:scale-[0.98]">
              📄 View Full Receipt
            </button>
            <button on:click={closeSuccessModal}
              class="flex w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all">
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}

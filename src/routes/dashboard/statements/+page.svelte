<script lang="ts">
import { onMount } from 'svelte';
import { toast } from '$lib/stores/toast';
import { formatCurrency } from '$lib/utils/formatters';
import { apiRequest } from '$lib/api/client';
import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

interface Statement {
  month: string;
  year: number;
  monthNum: number;
  period: string;
}

let statements: Statement[] = [];
let loading = true;
let selectedYear = new Date().getFullYear().toString();
let selectedAccount = 'all';
let userAccounts: { id: number; nickname?: string; account_type: string }[] = [];

const years = ['2026', '2025', '2024', '2023'];

onMount(async () => {
  // Load user accounts
  const profileRes = await apiRequest<any>('/user/profile.php');
  if (profileRes.success && profileRes.data) {
    userAccounts = profileRes.data.accounts ?? [];
  }
  
  // Generate statements for last 12 months
  generateStatements();
  loading = false;
});

function generateStatements() {
  statements = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthName = date.toLocaleString('default', { month: 'long' });
    const year = date.getFullYear();
    const monthNum = date.getMonth() + 1;
    const lastDay = new Date(year, monthNum, 0).getDate();
    
    statements.push({
      month: `${monthName} ${year}`,
      year,
      monthNum,
      period: `${monthName.substring(0, 3)} 1 - ${monthName.substring(0, 3)} ${lastDay}`
    });
  }
}

function handleDownload(statement: Statement) {
  const token = localStorage.getItem('auth_token');
  const params = new URLSearchParams({
    year: statement.year.toString(),
    month: statement.monthNum.toString()
  });
  if (selectedAccount !== 'all') {
    params.append('account_id', selectedAccount);
  }
  if (token) {
    params.append('_token', token);
  }
  window.open(`${API_BASE}/statements/generate.php?${params.toString()}`, '_blank');
  toast.success(`Opening ${statement.month} statement...`);
}

function handleEmail(statement: Statement) {
  toast.success(`Statement for ${statement.month} emailed to your registered address`);
}
</script>

<svelte:head>
	<title>Statements - Trust Banque</title>
</svelte:head>

<div>
	<!-- Page Header -->
	<div class="mb-8">
		<div class="flex items-center justify-between">
			<div>
				<h1 class="text-3xl font-bold tracking-tight text-slate-900">Statements</h1>
				<p class="mt-2 text-slate-600">Download and view your account statements.</p>
			</div>
			<div class="flex items-center gap-3">
				<select
					bind:value={selectedYear}
					class="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
				>
					{#each years as year}
						<option value={year}>{year}</option>
					{/each}
				</select>
<select
          bind:value={selectedAccount}
          class="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
          >
          <option value="all">All Accounts</option>
          {#each userAccounts as acc}
          <option value={acc.id}>{acc.nickname || acc.account_type}</option>
          {/each}
        </select>
			</div>
		</div>
	</div>

	<!-- Summary Cards -->
<!-- Summary Cards -->
{#if !loading}
<div class="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
  <div
  class="rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 text-white shadow-lg"
  >
  <p class="mb-2 text-sm font-medium text-emerald-100">Total Statements</p>
  <p class="text-4xl font-bold">{statements.length}</p>
  <p class="mt-2 text-sm text-emerald-100">Available for download</p>
  </div>
  <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
  <p class="mb-2 text-sm font-medium text-slate-500">This Year</p>
  <p class="text-4xl font-bold text-slate-900">{statements.filter(s => s.year === parseInt(selectedYear)).length}</p>
  <p class="mt-2 text-sm text-slate-500">Statements generated</p>
  </div>
  <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
  <p class="mb-2 text-sm font-medium text-slate-500">Last Statement</p>
  <p class="mt-1 text-xl font-bold text-slate-900">{statements[0]?.month || 'N/A'}</p>
  <p class="mt-2 text-sm text-slate-500">Generated on demand</p>
  </div>
  </div>
{/if}

<!-- Statements List -->
<div class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
  <div class="flex items-center justify-between border-b border-slate-200 p-6">
  <div>
    <h3 class="text-lg font-bold text-slate-900">Available Statements</h3>
    <p class="mt-1 text-sm text-slate-500">Statements are generated on-demand for the past 12 months</p>
  </div>
  </div>

  {#if loading}
  <div class="flex items-center justify-center py-24">
    <LoadingSpinner size="lg" />
  </div>
  {:else}
  <div class="divide-y divide-slate-100">
  {#each statements.filter(s => s.year.toString() === selectedYear) as statement}
    <div class="p-6 transition-colors hover:bg-slate-50">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4">
      <div
        class="flex h-14 w-14 items-center justify-center rounded-xl bg-slate-100 text-2xl"
      >
        📄
      </div>
      <div>
        <p class="text-lg font-semibold text-slate-900">{statement.month}</p>
        <p class="text-sm text-slate-500">{statement.period}</p>
        <div class="mt-2 flex items-center gap-3">
        <span class="text-xs text-slate-500">{userAccounts.length} accounts</span>
        <span class="text-slate-300">•</span>
        <span class="text-xs text-slate-500">On-demand generation</span>
        </div>
      </div>
      </div>

      <div class="flex items-center gap-3">
      <span
        class="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700"
      >
        ✓ Ready
      </span>
      <button
        on:click={() => handleDownload(statement)}
        class="inline-flex transform items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:scale-105 hover:bg-emerald-600"
      >
        <span>⬇️</span>
        <span>Download</span>
      </button>
      <button
        on:click={() => handleEmail(statement)}
        class="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-5 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-200"
      >
        <span>📧</span>
        <span>Email</span>
      </button>
      </div>
    </div>
    </div>
  {/each}
  </div>
  {/if}
  </div>

	<!-- Statement Settings -->
	<div class="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
		<div class="border-b border-slate-200 p-6">
			<h3 class="text-lg font-bold text-slate-900">Statement Preferences</h3>
			<p class="mt-1 text-sm text-slate-500">Manage how you receive your statements</p>
		</div>
		<div class="space-y-6 p-6">
			<div class="flex items-center justify-between">
				<div>
					<p class="font-semibold text-slate-900">Paperless Statements</p>
					<p class="mt-1 text-sm text-slate-500">Receive statements electronically only</p>
				</div>
				<label class="relative inline-flex cursor-pointer items-center">
					<input type="checkbox" checked class="peer sr-only" />
					<div
						class="peer h-7 w-14 rounded-full bg-slate-200 peer-checked:bg-emerald-500 peer-focus:ring-4 peer-focus:ring-emerald-300 peer-focus:outline-none after:absolute after:top-0.5 after:left-[4px] after:h-6 after:w-6 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white"
					></div>
				</label>
			</div>

			<div class="flex items-center justify-between">
				<div>
					<p class="font-semibold text-slate-900">Email Notifications</p>
					<p class="mt-1 text-sm text-slate-500">Get notified when new statements are ready</p>
				</div>
				<label class="relative inline-flex cursor-pointer items-center">
					<input type="checkbox" checked class="peer sr-only" />
					<div
						class="peer h-7 w-14 rounded-full bg-slate-200 peer-checked:bg-emerald-500 peer-focus:ring-4 peer-focus:ring-emerald-300 peer-focus:outline-none after:absolute after:top-0.5 after:left-[4px] after:h-6 after:w-6 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white"
					></div>
				</label>
			</div>

			<div class="flex items-center justify-between">
				<div>
					<p class="font-semibold text-slate-900">Auto-Download</p>
					<p class="mt-1 text-sm text-slate-500">
						Automatically download statements to your device
					</p>
				</div>
				<label class="relative inline-flex cursor-pointer items-center">
					<input type="checkbox" class="peer sr-only" />
					<div
						class="peer h-7 w-14 rounded-full bg-slate-200 peer-checked:bg-emerald-500 peer-focus:ring-4 peer-focus:ring-emerald-300 peer-focus:outline-none after:absolute after:top-0.5 after:left-[4px] after:h-6 after:w-6 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white"
					></div>
				</label>
			</div>
		</div>
	</div>
</div>

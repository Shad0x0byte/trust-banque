<script lang="ts">
	import { formatCurrency, formatDate } from '$lib/utils/formatters';
	import { apiRequest } from '$lib/api/client';
	import { onMount } from 'svelte';
	import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';

	let searchQuery = '';
	let typeFilter = 'all';
	let statusFilter = 'all';
	let loading = true;
	let transactions: any[] = [];

	onMount(async () => {
		const res = await apiRequest<any>('/admin/transactions.php');
		loading = false;
		if (res.success && res.data) {
			transactions = res.data.transactions ?? res.data ?? [];
		}
	});

	$: filteredTransactions = transactions.filter((tx) => {
		if (typeFilter !== 'all' && tx.type !== typeFilter) return false;
		if (statusFilter !== 'all' && tx.status !== statusFilter) return false;
		const q = searchQuery.toLowerCase();
		if (q && !tx.description?.toLowerCase().includes(q) && !(tx.merchant || '').toLowerCase().includes(q) && !String(tx.user_id).includes(q)) return false;
		return true;
	});

	function getStatusColor(status: string): string {
		switch (status) {
			case 'completed': return 'bg-emerald-100 text-emerald-700';
			case 'pending':   return 'bg-amber-100 text-amber-700';
			case 'flagged':   return 'bg-red-100 text-red-700';
			default:          return 'bg-slate-100 text-slate-700';
		}
	}
</script>

<svelte:head><title>All Transactions - Trust Banque Admin</title></svelte:head>

<div>
	<div class="mb-8">
		<h1 class="text-3xl font-bold tracking-tight text-slate-900">All Transactions</h1>
		<p class="mt-2 text-slate-600">View and manage all system transactions.</p>
	</div>

	<!-- Filters -->
	<div class="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
		<div class="flex flex-col gap-4 lg:flex-row">
			<div class="flex-1">
				<input type="text" bind:value={searchQuery} placeholder="Search by description, merchant or user ID..." class="block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 sm:text-sm" />
			</div>
			<div class="flex gap-2">
				<select bind:value={typeFilter} class="rounded-xl border border-slate-200 bg-white px-4 py-3 sm:text-sm">
					<option value="all">All Types</option>
					<option value="deposit">Deposits</option>
					<option value="payment">Payments</option>
					<option value="withdrawal">Withdrawals</option>
					<option value="transfer">Transfers</option>
					<option value="fee">Fees</option>
				</select>
				<select bind:value={statusFilter} class="rounded-xl border border-slate-200 bg-white px-4 py-3 sm:text-sm">
					<option value="all">All Status</option>
					<option value="completed">Completed</option>
					<option value="pending">Pending</option>
					<option value="flagged">Flagged</option>
					<option value="failed">Failed</option>
				</select>
			</div>
		</div>
	</div>

	<!-- Table -->
	<div class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
		{#if loading}
			<div class="flex items-center justify-center py-16"><LoadingSpinner size="lg" /></div>
		{:else}
		<div class="overflow-x-auto">
			<table class="w-full">
				<thead class="bg-slate-50">
					<tr>
						<th class="px-6 py-4 text-left text-xs font-semibold tracking-wider text-slate-500 uppercase">ID</th>
						<th class="px-6 py-4 text-left text-xs font-semibold tracking-wider text-slate-500 uppercase">User</th>
						<th class="px-6 py-4 text-left text-xs font-semibold tracking-wider text-slate-500 uppercase">Description</th>
						<th class="px-6 py-4 text-left text-xs font-semibold tracking-wider text-slate-500 uppercase">Type</th>
						<th class="px-6 py-4 text-left text-xs font-semibold tracking-wider text-slate-500 uppercase">Date</th>
						<th class="px-6 py-4 text-left text-xs font-semibold tracking-wider text-slate-500 uppercase">Status</th>
						<th class="px-6 py-4 text-right text-xs font-semibold tracking-wider text-slate-500 uppercase">Amount</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-slate-100">
					{#each filteredTransactions as tx}
						<tr class="transition-colors hover:bg-slate-50">
							<td class="px-6 py-4 font-mono text-sm text-slate-500">#{tx.id}</td>
							<td class="px-6 py-4">
								<p class="font-semibold text-slate-900">{tx.user_name || '—'}</p>
								<p class="text-xs text-slate-500">ID: {tx.user_id}</p>
							</td>
							<td class="px-6 py-4">
								<p class="font-medium text-slate-900">{tx.description}</p>
								{#if tx.merchant}<p class="text-xs text-slate-500">{tx.merchant}</p>{/if}
							</td>
							<td class="px-6 py-4">
								<span class="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 capitalize">{tx.type}</span>
							</td>
							<td class="px-6 py-4 text-sm text-slate-500">{formatDate(tx.created_at || tx.date)}</td>
							<td class="px-6 py-4">
								<span class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold capitalize {getStatusColor(tx.status)}">{tx.status}</span>
							</td>
							<td class="px-6 py-4 text-right">
								<span class="font-bold {tx.amount >= 0 ? 'text-green-600' : 'text-slate-900'}">{tx.amount >= 0 ? '+' : ''}{formatCurrency(tx.amount)}</span>
							</td>
						</tr>
					{:else}
						<tr><td colspan="7" class="py-12 text-center text-slate-500">No transactions found.</td></tr>
					{/each}
				</tbody>
			</table>
		</div>
		{/if}
	</div>
</div>

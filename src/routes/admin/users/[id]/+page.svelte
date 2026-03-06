<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { toast } from '$lib/stores/toast';
	import { formatCurrency, formatDate } from '$lib/utils/formatters';
	import { apiRequest } from '$lib/api/client';
	import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';

	$: userId = $page.params.id ? parseInt($page.params.id) : 0;

	// ── State ──────────────────────────────────────────────────────────────
	let loading = true;
	let user: any = null;
	let accounts: any[] = [];
	let transactions: any[] = [];
	let stats: any = null;

	// Balance panel
	let showBalancePanel = false;
	let selectedAccountId = '';
	let balanceMode: 'set' | 'adjust' = 'adjust';
	let balanceAmount = '';
	let balanceDescription = '';
	let balanceType = 'deposit';
	let balanceSenderName = '';
	let balanceDate = new Date().toISOString().split('T')[0];
	let savingBalance = false;

	// Transfer panel (alias for balance panel in "deposit" mode — same endpoint)
	let showTransferPanel = false;
	let txAccountId = '';
	let txAmount = '';
	let txDescription = '';
	let txType = 'deposit';
	let txSenderName = '';
	let txDate = new Date().toISOString().split('T')[0];
	let savingTx = false;

	// Picture upload
	let showPictureUpload = false;
	let pictureFile: File | null = null;
	let picturePreview: string | null = null;
	let uploadingPicture = false;

	function handlePictureFileChange(e: Event) {
		const input = e.target as HTMLInputElement;
		if (input.files && input.files[0]) {
			const file = input.files[0];
			if (file.size > 3 * 1024 * 1024) { toast.error('Photo must be under 3MB'); return; }
			pictureFile = file;
			const reader = new FileReader();
			reader.onload = (ev) => { picturePreview = ev.target?.result as string; };
			reader.readAsDataURL(file);
		}
	}

	async function handlePictureUpload() {
		if (!pictureFile) { toast.error('Select a photo first'); return; }
		uploadingPicture = true;
		const fd = new FormData();
		fd.append('picture', pictureFile);
		fd.append('user_id', String(userId));
		try {
			const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost/banking-api/public/api';
			const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
			const headers: Record<string,string> = {};
			if (token) headers['Authorization'] = `Bearer ${token}`;
			const resp = await fetch(`${API_BASE}/user/upload_picture.php`, { method: 'POST', headers, body: fd });
			const data = await resp.json();
			if (data.success) {
				toast.success('Profile picture updated');
				showPictureUpload = false;
				pictureFile = null; picturePreview = null;
				await loadUser();
			} else {
				toast.error(data.error || 'Upload failed');
			}
		} catch (e) {
			toast.error('Network error');
		} finally {
			uploadingPicture = false;
		}
	}

	// ── Load ───────────────────────────────────────────────────────────────
	onMount(async () => {
		await loadUser();
	});

	async function loadUser() {
		loading = true;
		const res = await apiRequest<any>(`/admin/user_detail.php?user_id=${userId}`);
		loading = false;
		if (res.success && res.data) {
			user         = res.data.user;
			accounts     = res.data.accounts;
			transactions = res.data.transactions;
			stats        = res.data.stats;
			if (accounts.length) {
				selectedAccountId = String(accounts[0].id);
				txAccountId       = String(accounts[0].id);
			}
		} else {
			toast.error(res.error || 'Failed to load user');
		}
	}

	// ── Balance adjust ─────────────────────────────────────────────────────
	async function handleBalanceSave() {
		if (!selectedAccountId) { toast.error('Select an account'); return; }
		const amt = parseFloat(balanceAmount);
		if (isNaN(amt) || amt === 0) { toast.error('Enter a valid amount'); return; }
		if (!balanceDescription.trim()) { toast.error('Description is required'); return; }

		savingBalance = true;
		const res = await apiRequest<any>('/admin/balance_adjust.php', {
			method: 'POST',
			body: JSON.stringify({
				account_id:  parseInt(selectedAccountId),
				mode:        balanceMode,
				amount:      amt,
				description: balanceDescription,
				type:        balanceType,
				sender_name: balanceSenderName,
				date:        balanceDate,
			}),
		});
		savingBalance = false;

		if (res.success) {
			toast.success(`Balance updated → ${formatCurrency(res.data.new_balance)}`);
			showBalancePanel = false;
			balanceAmount = ''; balanceDescription = ''; balanceSenderName = '';
			await loadUser();
		} else {
			toast.error(res.error || 'Failed to update balance');
		}
	}

	// ── Admin transfer ─────────────────────────────────────────────────────
	async function handleTransferSave() {
		if (!txAccountId) { toast.error('Select an account'); return; }
		const amt = parseFloat(txAmount);
		if (isNaN(amt) || amt <= 0) { toast.error('Enter a valid amount'); return; }
		if (!txDescription.trim()) { toast.error('Description is required'); return; }

		savingTx = true;
		const res = await apiRequest<any>('/admin/balance_adjust.php', {
			method: 'POST',
			body: JSON.stringify({
				account_id:  parseInt(txAccountId),
				mode:        'adjust',
				amount:      amt,         // always positive — credit
				description: txDescription,
				type:        txType,
				sender_name: txSenderName,
				date:        txDate,
			}),
		});
		savingTx = false;

		if (res.success) {
			toast.success(`Transaction posted — new balance ${formatCurrency(res.data.new_balance)}`);
			showTransferPanel = false;
			txAmount = ''; txDescription = ''; txSenderName = '';
			await loadUser();
		} else {
			toast.error(res.error || 'Failed to post transaction');
		}
	}

	// ── Helpers ────────────────────────────────────────────────────────────
	function getStatusColor(s: string) {
		return s === 'active'    ? 'bg-emerald-100 text-emerald-700'
		     : s === 'pending'   ? 'bg-amber-100 text-amber-700'
		     : s === 'flagged'   ? 'bg-red-100 text-red-700'
		     : 'bg-slate-100 text-slate-700';
	}

	$: selectedAccount = accounts.find(a => String(a.id) === selectedAccountId);
	$: totalBalance    = accounts.reduce((s, a) => s + a.balance, 0);
</script>

<svelte:head>
	<title>User #{userId} - Trust Banque Admin</title>
</svelte:head>

{#if loading}
	<div class="flex items-center justify-center py-24">
		<LoadingSpinner size="lg" />
	</div>

{:else if !user}
	<div class="text-center py-24">
		<p class="text-slate-500">User not found.</p>
		<a href="/admin/users" class="mt-4 inline-block text-emerald-600 hover:underline">← Back to Users</a>
	</div>

{:else}
<div>
	<!-- Header -->
	<div class="mb-8 flex items-start justify-between">
		<div>
			<a href="/admin/users" class="text-sm text-slate-500 hover:text-slate-700 hover:underline">← Back to Users</a>
			<h1 class="mt-2 text-3xl font-bold text-slate-900">{user.first_name} {user.last_name}</h1>
			<p class="mt-1 text-slate-500">User ID: {user.id} · {user.email}</p>
		</div>
		<span class="mt-3 inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold capitalize {getStatusColor(user.status)}">
			{user.status}
		</span>
	</div>

	<div class="grid grid-cols-1 gap-8 lg:grid-cols-3">
		<!-- ── Left column ──────────────────────────────────────────── -->
		<div class="space-y-8 lg:col-span-2">

			<!-- Profile -->
			<div class="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
				<div class="border-b border-slate-200 p-6">
					<h3 class="text-lg font-bold text-slate-900">Profile</h3>
				</div>
				<div class="p-6">
				<!-- Profile photo -->
				<div class="flex items-center gap-4 mb-6">
					{#if user.profile_picture_url}
						<img src={user.profile_picture_url} alt="Profile" class="w-20 h-20 rounded-full object-cover ring-2 ring-slate-200" />
					{:else}
						<div class="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-2xl font-bold text-white">
							{user.first_name?.[0]}{user.last_name?.[0]}
						</div>
					{/if}
					<div>
						<p class="font-bold text-slate-900">{user.first_name} {user.last_name}</p>
						<p class="text-sm text-slate-500">{user.email}</p>
						<button on:click={() => showPictureUpload = !showPictureUpload} class="mt-2 text-xs text-emerald-600 hover:underline font-medium">📷 Change photo</button>
					</div>
				</div>
				{#if showPictureUpload}
				<div class="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 space-y-3">
					<p class="text-sm font-semibold text-emerald-900">Upload new profile photo</p>
					<div class="flex items-center gap-4">
						{#if picturePreview}
							<img src={picturePreview} alt="Preview" class="w-16 h-16 rounded-full object-cover ring-2 ring-emerald-300" />
						{/if}
						<label class="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700">
							Choose Photo
							<input type="file" accept="image/*" on:change={handlePictureFileChange} class="hidden" />
						</label>
					</div>
					<div class="flex gap-2">
						<button on:click={handlePictureUpload} disabled={!pictureFile || uploadingPicture} class="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold disabled:opacity-50">
							{uploadingPicture ? 'Uploading...' : 'Upload'}
						</button>
						<button on:click={() => { showPictureUpload = false; pictureFile = null; picturePreview = null; }} class="px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-600">Cancel</button>
					</div>
				</div>
				{/if}
			</div>
			<div class="px-6 pb-6 grid grid-cols-2 gap-5 text-sm">
					<div><p class="text-slate-500 mb-1">Email</p><p class="font-semibold text-slate-900">{user.email}</p></div>
					<div><p class="text-slate-500 mb-1">Phone</p><p class="font-semibold text-slate-900">{user.phone || '—'}</p></div>
					<div><p class="text-slate-500 mb-1">Date of Birth</p><p class="font-semibold text-slate-900">{user.date_of_birth || '—'}</p></div>
					<div><p class="text-slate-500 mb-1">SSN (Last 4)</p><p class="font-semibold text-slate-900">{user.ssn_last_4 ? '****' + user.ssn_last_4 : '—'}</p></div>
					<div class="col-span-2"><p class="text-slate-500 mb-1">Address</p>
						<p class="font-semibold text-slate-900">
							{#if user.address_street}{user.address_street}, {user.address_city}, {user.address_state} {user.address_zip}{:else}—{/if}
						</p>
					</div>
					<div><p class="text-slate-500 mb-1">Member Since</p><p class="font-semibold text-slate-900">{formatDate(user.created_at)}</p></div>
					<div><p class="text-slate-500 mb-1">Last Login</p><p class="font-semibold text-slate-900">{user.last_login ? formatDate(user.last_login) : 'Never'}</p></div>
				</div>
			</div>

			<!-- Accounts -->
			<div class="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
				<div class="border-b border-slate-200 p-6">
					<h3 class="text-lg font-bold text-slate-900">Accounts</h3>
				</div>
				<div class="divide-y divide-slate-100">
					{#each accounts as acc}
						<div class="flex items-center justify-between px-6 py-4">
							<div>
								<p class="font-semibold text-slate-900 capitalize">{acc.nickname || acc.account_type}</p>
								<p class="text-xs text-slate-500 font-mono mt-0.5">{acc.account_number}</p>
							</div>
							<div class="text-right">
								<p class="text-xl font-bold text-slate-900">{formatCurrency(acc.balance)}</p>
								<span class="text-xs {acc.status === 'active' ? 'text-emerald-600' : 'text-red-500'} font-medium capitalize">{acc.status}</span>
							</div>
						</div>
					{/each}
					{#if accounts.length === 0}
						<p class="px-6 py-4 text-sm text-slate-500">No accounts found.</p>
					{/if}
				</div>
			</div>

			<!-- ── Balance Adjust Panel ───────────────────────────── -->
			{#if showBalancePanel}
			<div class="rounded-2xl border-2 border-emerald-300 bg-emerald-50 shadow-sm overflow-hidden">
				<div class="border-b border-emerald-200 bg-emerald-100 px-6 py-4 flex items-center justify-between">
					<h3 class="font-bold text-emerald-900">💰 Edit Balance</h3>
					<button on:click={() => showBalancePanel = false} class="text-emerald-600 hover:text-emerald-800 text-xl font-bold">×</button>
				</div>
				<div class="p-6 space-y-4">
					<!-- Account selector -->
					<div>
						<label class="block text-sm font-medium text-slate-700 mb-1">Account</label>
						<select bind:value={selectedAccountId} class="block w-full rounded-xl border border-slate-200 py-2.5 px-4 text-sm">
							{#each accounts as acc}
								<option value={String(acc.id)}>{acc.nickname || acc.account_type} — {formatCurrency(acc.balance)}</option>
							{/each}
						</select>
						{#if selectedAccount}
							<p class="mt-1 text-xs text-slate-500">Current balance: <strong>{formatCurrency(selectedAccount.balance)}</strong></p>
						{/if}
					</div>

					<!-- Mode toggle -->
					<div>
						<label class="block text-sm font-medium text-slate-700 mb-2">Mode</label>
						<div class="flex gap-3">
							<button type="button" on:click={() => balanceMode = 'set'}
								class="flex-1 py-2.5 rounded-xl border text-sm font-medium transition-colors {balanceMode === 'set' ? 'border-emerald-500 bg-emerald-600 text-white' : 'border-slate-200 text-slate-600 hover:border-slate-300'}">
								Set to exact amount
							</button>
							<button type="button" on:click={() => balanceMode = 'adjust'}
								class="flex-1 py-2.5 rounded-xl border text-sm font-medium transition-colors {balanceMode === 'adjust' ? 'border-emerald-500 bg-emerald-600 text-white' : 'border-slate-200 text-slate-600 hover:border-slate-300'}">
								Add / subtract
							</button>
						</div>
					</div>

					<!-- Amount -->
					<div>
						<label class="block text-sm font-medium text-slate-700 mb-1">
							{balanceMode === 'set' ? 'New Balance' : 'Amount (use − for debit, e.g. −50)'}
						</label>
						<div class="relative">
							<span class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium">$</span>
							<input type="number" bind:value={balanceAmount} step="0.01"
								class="block w-full rounded-xl border border-slate-200 py-3 pl-8 pr-4 text-sm"
								placeholder={balanceMode === 'set' ? '1000.00' : '+500 or -50'} />
						</div>
						{#if balanceMode === 'set' && selectedAccount && balanceAmount}
							<p class="mt-1 text-xs text-slate-500">
								Change: {parseFloat(balanceAmount) - selectedAccount.balance >= 0 ? '+' : ''}{formatCurrency(parseFloat(balanceAmount) - selectedAccount.balance)}
							</p>
						{/if}
					</div>

					<div class="grid grid-cols-2 gap-4">
						<!-- Type -->
						<div>
							<label class="block text-sm font-medium text-slate-700 mb-1">Transaction Type</label>
							<select bind:value={balanceType} class="block w-full rounded-xl border border-slate-200 py-2.5 px-4 text-sm">
								<option value="deposit">Deposit</option>
								<option value="withdrawal">Withdrawal</option>
								<option value="transfer">Transfer</option>
								<option value="payment">Payment</option>
								<option value="fee">Fee</option>
							</select>
						</div>
						<!-- Date -->
						<div>
							<label class="block text-sm font-medium text-slate-700 mb-1">Transaction Date</label>
							<input type="date" bind:value={balanceDate} class="block w-full rounded-xl border border-slate-200 py-2.5 px-4 text-sm" />
						</div>
					</div>

					<!-- Description -->
					<div>
						<label class="block text-sm font-medium text-slate-700 mb-1">Description <span class="text-red-500">*</span></label>
						<input type="text" bind:value={balanceDescription}
							class="block w-full rounded-xl border border-slate-200 py-2.5 px-4 text-sm"
							placeholder="e.g. Balance correction" />
					</div>

					<!-- Sender name -->
					<div>
						<label class="block text-sm font-medium text-slate-700 mb-1">Sender / Merchant Name (optional)</label>
						<input type="text" bind:value={balanceSenderName}
							class="block w-full rounded-xl border border-slate-200 py-2.5 px-4 text-sm"
							placeholder="e.g. Mrs B, ACME Corp" />
					</div>

					<div class="flex gap-3 pt-2">
						<button on:click={handleBalanceSave} disabled={savingBalance}
							class="flex-1 py-3 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2">
							{#if savingBalance}<LoadingSpinner size="sm" color="text-white" />{/if}
							{savingBalance ? 'Saving...' : 'Apply Balance Change'}
						</button>
						<button on:click={() => showBalancePanel = false}
							class="px-5 py-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50">
							Cancel
						</button>
					</div>
				</div>
			</div>
			{/if}

			<!-- ── Admin Transfer Panel ───────────────────────────── -->
			{#if showTransferPanel}
			<div class="rounded-2xl border-2 border-blue-300 bg-blue-50 shadow-sm overflow-hidden">
				<div class="border-b border-blue-200 bg-blue-100 px-6 py-4 flex items-center justify-between">
					<h3 class="font-bold text-blue-900">🏦 Post Transaction to Account</h3>
					<button on:click={() => showTransferPanel = false} class="text-blue-600 hover:text-blue-800 text-xl font-bold">×</button>
				</div>
				<div class="p-6 space-y-4">
					<div>
						<label class="block text-sm font-medium text-slate-700 mb-1">Target Account</label>
						<select bind:value={txAccountId} class="block w-full rounded-xl border border-slate-200 py-2.5 px-4 text-sm">
							{#each accounts as acc}
								<option value={String(acc.id)}>{acc.nickname || acc.account_type} — {formatCurrency(acc.balance)}</option>
							{/each}
						</select>
					</div>

					<div class="grid grid-cols-2 gap-4">
						<div>
							<label class="block text-sm font-medium text-slate-700 mb-1">Amount <span class="text-red-500">*</span></label>
							<div class="relative">
								<span class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium">$</span>
								<input type="number" bind:value={txAmount} step="0.01" min="0.01"
									class="block w-full rounded-xl border border-slate-200 py-3 pl-8 pr-4 text-sm"
									placeholder="20.00" />
							</div>
						</div>
						<div>
							<label class="block text-sm font-medium text-slate-700 mb-1">Transaction Type</label>
							<select bind:value={txType} class="block w-full rounded-xl border border-slate-200 py-2.5 px-4 text-sm">
								<option value="deposit">Deposit</option>
								<option value="transfer">Transfer</option>
								<option value="payment">Payment</option>
								<option value="withdrawal">Withdrawal</option>
								<option value="fee">Fee</option>
							</select>
						</div>
					</div>

					<div>
						<label class="block text-sm font-medium text-slate-700 mb-1">Sender / From Name</label>
						<input type="text" bind:value={txSenderName}
							class="block w-full rounded-xl border border-slate-200 py-2.5 px-4 text-sm"
							placeholder="e.g. Mrs B, Wire Transfer, ACME Corp" />
						<p class="mt-1 text-xs text-slate-500">This appears as the merchant/sender in the user's transaction history.</p>
					</div>

					<div>
						<label class="block text-sm font-medium text-slate-700 mb-1">Description <span class="text-red-500">*</span></label>
						<input type="text" bind:value={txDescription}
							class="block w-full rounded-xl border border-slate-200 py-2.5 px-4 text-sm"
							placeholder="e.g. Wire transfer from Mrs B" />
					</div>

					<div>
						<label class="block text-sm font-medium text-slate-700 mb-1">Transaction Date</label>
						<input type="date" bind:value={txDate} class="block w-full rounded-xl border border-slate-200 py-2.5 px-4 text-sm" />
					</div>

					<!-- Preview -->
					{#if txAmount && txDescription}
					<div class="rounded-xl bg-white border border-blue-200 p-4 text-sm">
						<p class="text-xs font-semibold text-slate-500 uppercase mb-2">Preview — how it appears to user</p>
						<div class="flex items-center justify-between">
							<div>
								<p class="font-semibold text-slate-900">{txDescription}</p>
								<p class="text-slate-500 capitalize">{txSenderName || 'Admin'} · {txType}</p>
							</div>
							<span class="font-bold text-green-600">+{formatCurrency(parseFloat(txAmount) || 0)}</span>
						</div>
					</div>
					{/if}

					<div class="flex gap-3 pt-2">
						<button on:click={handleTransferSave} disabled={savingTx}
							class="flex-1 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2">
							{#if savingTx}<LoadingSpinner size="sm" color="text-white" />{/if}
							{savingTx ? 'Posting...' : 'Post Transaction'}
						</button>
						<button on:click={() => showTransferPanel = false}
							class="px-5 py-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50">
							Cancel
						</button>
					</div>
				</div>
			</div>
			{/if}

			<!-- Transaction History -->
			<div class="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
				<div class="flex items-center justify-between border-b border-slate-200 p-6">
					<h3 class="text-lg font-bold text-slate-900">Transaction History</h3>
					<span class="text-xs text-slate-500">Last 20</span>
				</div>
				{#if transactions.length === 0}
					<p class="px-6 py-8 text-center text-sm text-slate-500">No transactions yet.</p>
				{:else}
				<div class="overflow-x-auto">
					<table class="w-full">
						<thead class="bg-slate-50">
							<tr>
								<th class="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Description</th>
								<th class="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Type</th>
								<th class="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Date</th>
								<th class="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Amount</th>
								<th class="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Balance After</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-slate-100">
							{#each transactions as tx}
								<tr class="hover:bg-slate-50 transition-colors">
									<td class="px-6 py-4">
										<p class="font-medium text-slate-900">{tx.description}</p>
										{#if tx.merchant}<p class="text-xs text-slate-500">{tx.merchant}</p>{/if}
									</td>
									<td class="px-6 py-4">
										<span class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold capitalize bg-slate-100 text-slate-700">{tx.type}</span>
									</td>
									<td class="px-6 py-4 text-sm text-slate-500">{formatDate(tx.created_at)}</td>
									<td class="px-6 py-4 text-right font-bold {tx.amount >= 0 ? 'text-green-600' : 'text-slate-900'}">
										{tx.amount >= 0 ? '+' : ''}{formatCurrency(tx.amount)}
									</td>
									<td class="px-6 py-4 text-right text-sm text-slate-500">
										{tx.balance_after != null ? formatCurrency(tx.balance_after) : '—'}
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
				{/if}
			</div>
		</div>

		<!-- ── Sidebar ───────────────────────────────────────────────── -->
		<div class="space-y-6">

			<!-- Admin Actions -->
			<div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
				<h3 class="mb-4 text-lg font-bold text-slate-900">Admin Actions</h3>
				<div class="space-y-3">
					<button on:click={() => { showBalancePanel = !showBalancePanel; showTransferPanel = false; }}
						class="flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-all {showBalancePanel ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200 bg-slate-50 hover:border-emerald-200 hover:bg-emerald-50'}">
						<span class="text-xl">💰</span>
						<div>
							<p class="text-sm font-semibold text-slate-900">Edit Balance</p>
							<p class="text-xs text-slate-500">Set exact amount or add/subtract</p>
						</div>
					</button>

					<button on:click={() => { showTransferPanel = !showTransferPanel; showBalancePanel = false; }}
						class="flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-all {showTransferPanel ? 'border-blue-400 bg-blue-50' : 'border-slate-200 bg-slate-50 hover:border-blue-200 hover:bg-blue-50'}">
						<span class="text-xl">🏦</span>
						<div>
							<p class="text-sm font-semibold text-slate-900">Post Transaction</p>
							<p class="text-xs text-slate-500">Credit account with custom details</p>
						</div>
					</button>

					<button
						on:click={async () => {
							const newStatus = user.status === 'active' ? 'suspended' : 'active';
							const res = await apiRequest('/admin/user_update.php', { method: 'POST', body: JSON.stringify({ user_id: userId, status: newStatus }) });
							if (res.success) { user.status = newStatus; toast.success(`User ${newStatus}`); }
							else toast.error('Failed to update status');
						}}
						class="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-left transition-all hover:border-amber-200 hover:bg-amber-50">
						<span class="text-xl">🚫</span>
						<div>
							<p class="text-sm font-semibold text-slate-900">{user.status === 'active' ? 'Suspend' : 'Activate'} User</p>
							<p class="text-xs text-slate-500">{user.status === 'active' ? 'Restrict access' : 'Restore access'}</p>
						</div>
					</button>

					<button
						on:click={async () => {
							if (!confirm('Delete this user permanently?')) return;
							const res = await apiRequest('/admin/user_delete.php', { method: 'POST', body: JSON.stringify({ user_id: userId }) });
							if (res.success) { toast.success('User deleted'); goto('/admin/users'); }
							else toast.error('Failed to delete user');
						}}
						class="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-left transition-all hover:border-red-200 hover:bg-red-50">
						<span class="text-xl">🗑️</span>
						<div>
							<p class="text-sm font-semibold text-slate-900">Delete User</p>
							<p class="text-xs text-slate-500">Permanently remove account</p>
						</div>
					</button>
				</div>
			</div>

			<!-- Account Stats -->
			<div class="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 p-6 text-white shadow-lg">
				<h3 class="mb-4 text-lg font-bold">Account Statistics</h3>
				<div class="space-y-3">
					<div class="flex justify-between border-b border-slate-700 pb-3">
						<span class="text-sm text-slate-400">Total Balance</span>
						<span class="font-bold text-emerald-400">{formatCurrency(totalBalance)}</span>
					</div>
					<div class="flex justify-between border-b border-slate-700 pb-3">
						<span class="text-sm text-slate-400">Transactions</span>
						<span class="font-semibold">{stats?.total_transactions ?? 0}</span>
					</div>
					<div class="flex justify-between border-b border-slate-700 pb-3">
						<span class="text-sm text-slate-400">Total In</span>
						<span class="font-semibold text-green-400">+{formatCurrency(stats?.total_in ?? 0)}</span>
					</div>
					<div class="flex justify-between pb-1">
						<span class="text-sm text-slate-400">Total Out</span>
						<span class="font-semibold text-red-400">{formatCurrency(stats?.total_out ?? 0)}</span>
					</div>
				</div>
			</div>

			<!-- Account flags -->
			<div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
				<h3 class="mb-4 text-lg font-bold text-slate-900">Account Flags</h3>
				<div class="space-y-2 text-sm">
					<div class="flex items-center gap-2">
						<span class="{user.verified ? 'text-emerald-600' : 'text-red-500'}">{user.verified ? '✓' : '✗'}</span>
						<span class="text-slate-600">Email verified</span>
					</div>
					<div class="flex items-center gap-2">
						<span class="{user.role === 'admin' ? 'text-blue-600' : 'text-slate-400'}">●</span>
						<span class="text-slate-600">Role: <strong class="capitalize">{user.role}</strong></span>
					</div>
					<div class="flex items-center gap-2">
						<span class="{user.status === 'active' ? 'text-emerald-600' : 'text-amber-500'}">●</span>
						<span class="text-slate-600">Status: <strong class="capitalize">{user.status}</strong></span>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
{/if}

<script lang="ts">
	import { toast } from '$lib/stores/toast';
	import { onMount } from 'svelte';
	import { apiRequest } from '$lib/api/client';

	let passwordData = { currentPassword: '', newPassword: '', confirmPassword: '' };
	let twoFactorEnabled = false;
	let biometricEnabled = false;
	let loginAlerts = true;
	let showPasswordModal = false;
	let loadingSessions = true;

	interface SessionEntry {
		ip_address: string;
		user_agent: string;
		created_at: string;
		expires_at: string;
		current?: boolean;
		device?: string;
		location?: string;
	}

	let sessions: SessionEntry[] = [];

	// Parse user agent to a friendly device name
	function parseDevice(ua: string): string {
		if (!ua) return 'Unknown Device';
		if (/iPhone/.test(ua)) return '📱 iPhone';
		if (/iPad/.test(ua)) return '📲 iPad';
		if (/Android/.test(ua) && /Mobile/.test(ua)) return '📱 Android Phone';
		if (/Android/.test(ua)) return '📲 Android Tablet';
		if (/Macintosh/.test(ua)) return '💻 Mac';
		if (/Windows/.test(ua)) return '💻 Windows PC';
		if (/Linux/.test(ua)) return '💻 Linux';
		return '🖥️ Browser';
	}

	function formatDate(d: string) {
		if (!d) return 'Unknown';
		const date = new Date(d);
		const now = new Date();
		const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
		if (diff < 60) return 'Just now';
		if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
		if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
		return `${Math.floor(diff / 86400)}d ago`;
	}

	onMount(async () => {
		const res = await apiRequest<any>('/user/profile.php');
		loadingSessions = false;
		if (res.success && res.data?.sessions) {
			const raw: any[] = res.data.sessions;
			// Mark the most recent session as current
			sessions = raw.map((s, i) => ({
				...s,
				current: i === 0,
				device: parseDevice(s.user_agent),
				location: s.ip_address || 'Unknown location',
			}));
		}
	});

	async function handleSavePassword() {
		if (!passwordData.currentPassword) { toast.error('Enter your current password'); return; }
		if (passwordData.newPassword !== passwordData.confirmPassword) { toast.error('Passwords do not match'); return; }
		if (passwordData.newPassword.length < 8) { toast.error('Password must be at least 8 characters'); return; }

		const res = await apiRequest('/user/change_password.php', {
			method: 'POST',
			body: JSON.stringify({ current_password: passwordData.currentPassword, new_password: passwordData.newPassword }),
		});
		if (res.success) {
			toast.success('Password changed successfully!');
			showPasswordModal = false;
			passwordData = { currentPassword: '', newPassword: '', confirmPassword: '' };
		} else {
			toast.error((res as any).error || 'Failed to change password');
		}
	}
</script>

<svelte:head><title>Security - Trust Banque</title></svelte:head>

<div>
	<div class="mb-8">
		<h1 class="text-3xl font-bold tracking-tight text-slate-900">Security Center</h1>
		<p class="mt-2 text-slate-600">Manage your account security settings.</p>
	</div>

	<!-- Security Score -->
	<div class="mb-8 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-8 text-white shadow-xl shadow-emerald-500/20">
		<div class="flex items-center justify-between">
			<div>
				<p class="mb-2 font-medium text-emerald-100">Security Score</p>
				<h2 class="mb-4 text-5xl font-bold">95/100</h2>
				<p class="text-emerald-100">Excellent! Your account is well protected.</p>
			</div>
			<div class="relative h-32 w-32">
				<svg class="h-full w-full -rotate-90 transform">
					<circle cx="64" cy="64" r="56" stroke="rgba(255,255,255,0.2)" stroke-width="12" fill="none" />
					<circle cx="64" cy="64" r="56" stroke="white" stroke-width="12" fill="none" stroke-dasharray="351.86" stroke-dashoffset="17.59" stroke-linecap="round" />
				</svg>
			</div>
		</div>
	</div>

	<div class="grid grid-cols-1 gap-8 lg:grid-cols-3">
		<div class="space-y-8 lg:col-span-2">
			<!-- Password -->
			<section class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
				<div class="flex items-center justify-between border-b border-slate-200 p-6">
					<div>
						<h3 class="text-lg font-bold text-slate-900">Password</h3>
						<p class="mt-1 text-sm text-slate-500">Keep your password strong and unique</p>
					</div>
					<button on:click={() => showPasswordModal = true} class="rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-emerald-600">
						Change Password
					</button>
				</div>
				<div class="p-6">
					<div class="flex items-center gap-4 rounded-xl border border-emerald-100 bg-emerald-50 p-4">
						<span class="text-2xl">✅</span>
						<div>
							<p class="font-semibold text-emerald-900">Strong Password</p>
							<p class="text-sm text-emerald-700">Your password meets all security requirements</p>
						</div>
					</div>
				</div>
			</section>

			<!-- 2FA -->
			<section class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
				<div class="border-b border-slate-200 p-6">
					<div class="flex items-center justify-between">
						<div>
							<h3 class="text-lg font-bold text-slate-900">Two-Factor Authentication</h3>
							<p class="mt-1 text-sm text-slate-500">Add an extra layer of security</p>
						</div>
						<label class="relative inline-flex cursor-pointer items-center">
							<input type="checkbox" bind:checked={twoFactorEnabled} class="peer sr-only" />
							<div class="peer h-7 w-14 rounded-full bg-slate-200 peer-checked:bg-emerald-500 peer-focus:ring-4 peer-focus:ring-emerald-300 peer-focus:outline-none after:absolute after:top-0.5 after:left-[4px] after:h-6 after:w-6 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
						</label>
					</div>
				</div>
				<div class="p-6 space-y-3">
					<div class="flex items-center gap-4 rounded-xl bg-slate-50 p-4">
						<div class="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-2xl">📱</div>
						<div class="flex-1">
							<p class="font-semibold text-slate-900">Authenticator App</p>
							<p class="text-sm text-slate-500">Use Google Authenticator or similar</p>
						</div>
						{#if twoFactorEnabled}
							<span class="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">✓ Active</span>
						{/if}
					</div>
				</div>
			</section>

			<!-- Login Alerts -->
			<section class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
				<div class="border-b border-slate-200 p-6">
					<div class="flex items-center justify-between">
						<div>
							<h3 class="text-lg font-bold text-slate-900">Login Alerts</h3>
							<p class="mt-1 text-sm text-slate-500">Get notified of new logins</p>
						</div>
						<label class="relative inline-flex cursor-pointer items-center">
							<input type="checkbox" bind:checked={loginAlerts} class="peer sr-only" />
							<div class="peer h-7 w-14 rounded-full bg-slate-200 peer-checked:bg-emerald-500 peer-focus:ring-4 peer-focus:ring-emerald-300 peer-focus:outline-none after:absolute after:top-0.5 after:left-[4px] after:h-6 after:w-6 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
						</label>
					</div>
				</div>
				<div class="p-6">
					<p class="text-sm text-slate-600">You'll receive a notification whenever your account is accessed from a new device or location.</p>
				</div>
			</section>
		</div>

		<!-- Sidebar -->
		<div class="space-y-8">
			<!-- Active Sessions (REAL data) -->
			<section class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
				<div class="flex items-center justify-between border-b border-slate-200 p-6">
					<div>
						<h3 class="text-lg font-bold text-slate-900">Active Sessions</h3>
						<p class="mt-1 text-sm text-slate-500">{sessions.length} active session{sessions.length !== 1 ? 's' : ''}</p>
					</div>
				</div>
				<div class="divide-y divide-slate-100">
					{#if loadingSessions}
						<div class="p-6 text-center text-sm text-slate-400">Loading sessions…</div>
					{:else if sessions.length === 0}
						<div class="p-6 text-center text-sm text-slate-400">No active sessions found.</div>
					{:else}
						{#each sessions as session}
							<div class="p-4 transition-colors hover:bg-slate-50">
								<div class="mb-2 flex items-center justify-between">
									<div class="flex items-center gap-3">
										<span class="text-xl">{session.device?.charAt(0) === '📱' ? '📱' : session.device?.charAt(0) === '📲' ? '📲' : '💻'}</span>
										<div>
											<p class="text-sm font-semibold text-slate-900">{session.device}</p>
											<p class="text-xs text-slate-500">{session.location}</p>
										</div>
									</div>
									{#if session.current}
										<span class="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">Current</span>
									{/if}
								</div>
								<p class="text-xs text-slate-500">Started: {formatDate(session.created_at)}</p>
								<p class="text-xs text-slate-400 mt-0.5 truncate" title={session.user_agent}>{session.user_agent.slice(0, 60)}{session.user_agent.length > 60 ? '...' : ''}</p>
							</div>
						{/each}
					{/if}
				</div>
			</section>

			<!-- Security Tips -->
			<section class="overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-purple-50 shadow-sm">
				<div class="p-6">
					<h3 class="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900"><span class="text-xl">💡</span> Security Tips</h3>
					<ul class="space-y-3 text-sm">
						<li class="flex items-start gap-2"><span class="font-bold text-blue-600">•</span><span class="text-slate-700">Never share your password or 2FA codes</span></li>
						<li class="flex items-start gap-2"><span class="font-bold text-blue-600">•</span><span class="text-slate-700">Use unique passwords for each account</span></li>
						<li class="flex items-start gap-2"><span class="font-bold text-blue-600">•</span><span class="text-slate-700">Review active sessions regularly</span></li>
						<li class="flex items-start gap-2"><span class="font-bold text-blue-600">•</span><span class="text-slate-700">Contact support if you see unfamiliar sessions</span></li>
					</ul>
				</div>
			</section>
		</div>
	</div>

	<!-- Change Password Modal -->
	{#if showPasswordModal}
		<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
			<div class="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">
				<div class="mb-6 text-center">
					<div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100"><span class="text-3xl">🔑</span></div>
					<h3 class="text-2xl font-bold text-slate-900">Change Password</h3>
					<p class="mt-2 text-slate-600">Enter your current and new password</p>
				</div>
				<div class="mb-6 space-y-4">
					<div><label class="mb-2 block text-sm font-semibold text-slate-700">Current Password</label><input type="password" bind:value={passwordData.currentPassword} class="block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 sm:text-sm" /></div>
					<div><label class="mb-2 block text-sm font-semibold text-slate-700">New Password</label><input type="password" bind:value={passwordData.newPassword} class="block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 sm:text-sm" /></div>
					<div><label class="mb-2 block text-sm font-semibold text-slate-700">Confirm New Password</label><input type="password" bind:value={passwordData.confirmPassword} class="block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 sm:text-sm" /></div>
				</div>
				<div class="flex gap-3">
					<button on:click={() => { showPasswordModal = false; passwordData = { currentPassword: '', newPassword: '', confirmPassword: '' }; }} class="flex-1 rounded-xl border border-slate-300 px-4 py-3.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
					<button on:click={handleSavePassword} class="flex-1 rounded-xl bg-emerald-600 px-4 py-3.5 text-sm font-bold text-white hover:bg-emerald-700">Save Password</button>
				</div>
			</div>
		</div>
	{/if}
</div>

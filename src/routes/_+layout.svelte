<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { auth } from '$lib/stores/auth';
	import Toast from '$lib/components/Toast.svelte';
	import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
	import type { AuthState } from '$lib/types';

	let sidebarOpen = false;
	let authState: AuthState = { isAuthenticated: false, user: null, token: null, loading: true };

	onMount(() => {
		auth.loadFromStorage();

		const unsubscribe = auth.subscribe((state) => {
			authState = state;
			if (!state.loading && !state.isAuthenticated) {
				goto('/login');
			}
		});

		return () => unsubscribe();
	});

	const navItems = [
		{ href: '/dashboard', label: 'Overview', icon: '📊' },
		{ href: '/dashboard/accounts', label: 'Accounts', icon: '💳' },
		{ href: '/dashboard/transactions', label: 'Transactions', icon: '📋' },
		{ href: '/dashboard/transfer', label: 'Transfer', icon: '💸' },
		{ href: '/dashboard/cards', label: 'Cards', icon: '🏧' },
		{ href: '/dashboard/statements', label: 'Statements', icon: '📄' },
		{ href: '/dashboard/settings', label: 'Settings', icon: '⚙️' },
		{ href: '/dashboard/security', label: 'Security', icon: '🔒' }
	];

	function handleLogout() {
		auth.clearAuth();
		goto('/login');
	}
</script>

<div class="min-h-screen bg-slate-50">
	<!-- Mobile Header -->
	<header
		class="bg-primary sticky top-0 z-40 flex items-center justify-between p-4 text-white lg:hidden"
	>
		<div class="flex items-center gap-2">
			<span class="text-xl">🏦</span>
			<span class="font-bold">Trust Banque</span>
		</div>
		<button on:click={() => (sidebarOpen = !sidebarOpen)} class="p-2 text-white">
			{#if sidebarOpen}
				<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M6 18L18 6M6 6l12 12"
					/>
				</svg>
			{:else}
				<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M4 6h16M4 12h16M4 18h16"
					/>
				</svg>
			{/if}
		</button>
	</header>

	<div class="flex">
		<!-- Sidebar -->
		<aside
			class="bg-primary fixed top-0 left-0 h-screen w-64 transform text-white lg:sticky {sidebarOpen
				? 'translate-x-0'
				: '-translate-x-full'} z-50 transition-transform lg:translate-x-0"
		>
			<div class="p-6">
				<a href="/" class="mb-8 flex items-center gap-2">
					<div class="bg-accent flex h-10 w-10 items-center justify-center rounded-lg">
						<span class="text-xl font-bold">🏦</span>
					</div>
					<span class="text-xl font-bold">Trust Banque</span>
				</a>

				<!-- User Info -->
				<div class="bg-primary-light mb-6 rounded-lg p-4">
					<div class="mb-3 flex items-center gap-3">
						<div
							class="bg-accent flex h-10 w-10 items-center justify-center rounded-full font-bold"
						>
							{authState.user?.first_name?.charAt(0)}{authState.user?.last_name?.charAt(0)}
						</div>
						<div class="overflow-hidden">
							<p class="truncate text-sm font-medium">
								{authState.user?.first_name}
								{authState.user?.last_name}
							</p>
							<p class="truncate text-xs text-slate-400">{authState.user?.email}</p>
						</div>
					</div>
				</div>

				<!-- Navigation -->
				<nav class="space-y-1">
					{#each navItems as item}
						<a
							href={item.href}
							class="hover:bg-primary-light flex items-center gap-3 rounded-lg px-4 py-3 text-slate-300 transition-colors hover:text-white"
							class:text-accent={$page.url.pathname === item.href}
						>
							<span class="text-lg">{item.icon}</span>
							<span class="text-sm font-medium">{item.label}</span>
						</a>
					{/each}
				</nav>
			</div>

			<!-- Logout -->
			<div class="absolute right-0 bottom-0 left-0 border-t border-slate-700 p-6">
				<button
					on:click={handleLogout}
					class="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-slate-300 transition-colors hover:bg-red-500/10 hover:text-red-400"
				>
					<span class="text-lg">🚪</span>
					<span class="text-sm font-medium">Sign Out</span>
				</button>
			</div>
		</aside>

		<!-- Overlay for mobile -->
		{#if sidebarOpen}
			<div
				class="fixed inset-0 z-40 bg-black/50 lg:hidden"
				on:click={() => (sidebarOpen = false)}
			></div>
		{/if}

		<!-- Main Content -->
		<main class="flex-1 lg:ml-64">
			{#if authState.loading}
				<div class="flex min-h-screen items-center justify-center">
					<LoadingSpinner size="lg" />
				</div>
			{:else}
				<slot />
			{/if}
		</main>
	</div>

	<Toast />
</div>

<script lang="ts">
	import '../../app.css';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { auth } from '$lib/stores/auth';
	import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
	import type { AuthState, User } from '$lib/types';

	let sidebarOpen = false;
	let authState: AuthState = { isAuthenticated: false, user: null, token: null, loading: true };
	let isAdmin = false;

	onMount(() => {
		auth.loadFromStorage();

		const unsubscribe = auth.subscribe((state) => {
			authState = state;
			if (!state.loading) {
				if (!state.isAuthenticated) {
					goto('/login');
				} else if (state.user?.role !== 'admin') {
					goto('/dashboard');
				} else {
					isAdmin = true;
				}
			}
		});

		return () => unsubscribe();
	});

	const navItems = [
		{ href: '/admin', label: 'Overview', icon: '📊' },
		{ href: '/admin/users', label: 'User Management', icon: '👥' },
		{ href: '/admin/transactions', label: 'All Transactions', icon: '📋' },
		{ href: '/admin/cards', label: 'Card Management', icon: '💳' },
		{ href: '/admin/logs', label: 'Activity Logs', icon: '📜' },
		{ href: '/admin/settings', label: 'Admin Settings', icon: '⚙️' }
	];

	function handleLogout() {
		auth.clearAuth();
		goto('/login');
	}

	function getInitials(): string {
		if (!authState.user?.first_name || !authState.user?.last_name) return 'A';
		return (authState.user.first_name[0] + authState.user.last_name[0]).toUpperCase();
	}

	function getDisplayName(): string {
		if (!authState.user?.first_name) return 'Admin';
		return `${authState.user.first_name} ${authState.user.last_name || ''}`;
	}
</script>

<div class="min-h-screen bg-slate-50">
	{#if authState.loading}
		<div class="flex min-h-screen items-center justify-center">
			<LoadingSpinner size="lg" />
		</div>
	{:else if !isAdmin}
		<div class="flex min-h-screen items-center justify-center">
			<LoadingSpinner size="lg" />
		</div>
	{:else}
		<div class="flex min-h-screen">
			<!-- Admin Sidebar -->
			<aside
				class="fixed top-0 left-0 h-screen w-80 transform bg-slate-900 text-white {sidebarOpen
					? 'translate-x-0'
					: '-translate-x-full'} z-50 shadow-2xl transition-transform duration-300 ease-in-out lg:translate-x-0"
			>
				<div class="flex h-full flex-col">
					<!-- Logo -->
					<div class="border-b border-slate-800 p-6">
						<a href="/admin" class="flex items-center gap-3">
							<div
								class="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-red-700 shadow-lg shadow-red-500/25"
							>
								<span class="text-2xl">🛡️</span>
							</div>
							<div>
								<span class="block text-xl font-bold tracking-tight">Trust Banque</span>
								<span class="text-xs font-medium text-red-400">Admin Panel</span>
							</div>
						</a>
					</div>

					<!-- Admin Info -->
					<div class="border-b border-slate-800 p-6">
						<div class="rounded-2xl border border-red-500/20 bg-red-500/10 p-4">
							<div class="flex items-center gap-3">
								<div
									class="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-red-700 font-bold text-white shadow-lg"
								>
									{getInitials()}
								</div>
								<div class="min-w-0 flex-1">
									<p class="truncate text-sm font-semibold text-white">{getDisplayName()}</p>
									<p class="mt-0.5 truncate text-xs text-red-400">Administrator</p>
								</div>
							</div>
						</div>
					</div>

					<!-- Navigation -->
					<nav class="flex-1 space-y-1 overflow-y-auto p-4">
						{#each navItems as item}
							<a
								href={item.href}
								class="group flex items-center gap-3 rounded-xl px-4 py-3.5 text-slate-300 transition-all hover:bg-slate-800 hover:text-white {$page
									.url.pathname === item.href
									? 'bg-red-600/20 text-red-400'
									: ''}"
							>
								<span class="text-xl transition-transform duration-200 group-hover:scale-110"
									>{item.icon}</span
								>
								<span class="text-sm font-medium">{item.label}</span>
								{#if $page.url.pathname === item.href}
									<span class="ml-auto h-1.5 w-1.5 rounded-full bg-red-400"></span>
								{/if}
							</a>
						{/each}
					</nav>

					<!-- Logout -->
					<div class="border-t border-slate-800 p-4">
						<button
							on:click={handleLogout}
							class="flex w-full items-center gap-3 rounded-xl border border-slate-700 px-4 py-3.5 text-slate-300 transition-all hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400"
						>
							<span class="text-xl">🚪</span>
							<span class="text-sm font-medium">Sign Out</span>
						</button>
					</div>
				</div>
			</aside>

			<!-- Mobile Header -->
			<header
				class="fixed top-0 right-0 left-0 z-40 flex items-center justify-between bg-slate-900 p-4 text-white shadow-lg lg:hidden"
			>
				<div class="flex items-center gap-2">
					<div
						class="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-red-700 shadow-lg"
					>
						<span class="text-xl">🛡️</span>
					</div>
					<span class="text-lg font-bold">Admin Panel</span>
				</div>
				<button
					on:click={() => (sidebarOpen = !sidebarOpen)}
					class="rounded-lg p-2 text-white transition-colors hover:bg-slate-800"
				>
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

			<!-- Overlay -->
			{#if sidebarOpen}
				<div
					class="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
					on:click={() => (sidebarOpen = false)}
				></div>
			{/if}

			<!-- Main Content -->
			<main class="min-h-screen flex-1 lg:ml-80">
				<div class="mx-auto max-w-7xl px-6 py-8 lg:px-8">
					<slot />
				</div>
			</main>
		</div>
	{/if}
</div>

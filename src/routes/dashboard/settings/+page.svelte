<script lang="ts">
	import { toast } from '$lib/stores/toast';
	import { auth } from '$lib/stores/auth';
	import { onMount } from 'svelte';

	let authState = $auth;

	let profileData = {
		firstName: authState.user?.first_name || 'Demo',
		lastName: authState.user?.last_name || 'User',
		email: authState.user?.email || 'demo@Trust Banque.com',
		phone: authState.user?.phone || '(555) 123-4567',
		dateOfBirth: '1990-01-15',
		address: '123 Main Street',
		city: 'New York',
		state: 'NY',
		zipCode: '10001'
	};

	let notifications = {
		email: true,
		sms: false,
		push: true,
		transactions: true,
		security: true,
		marketing: false
	};

	let preferences = {
		language: 'en',
		currency: 'USD',
		timezone: 'America/New_York',
		theme: 'light' as 'light' | 'dark' | 'system'
	};

	let currentTheme = 'light';

	// Apply theme on mount and when preferences change
	onMount(() => {
		// Load saved theme from localStorage
		if (typeof window !== 'undefined') {
			const savedTheme = localStorage.getItem('theme') || 'light';
			preferences.theme = savedTheme as 'light' | 'dark' | 'system';
			applyTheme(savedTheme);
		}
	});

	function applyTheme(theme: string) {
		if (typeof window === 'undefined') return;

		const html = document.documentElement;

		if (theme === 'system') {
			const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
				? 'dark'
				: 'light';
			html.setAttribute('data-theme', systemTheme);
			currentTheme = systemTheme;
		} else {
			html.setAttribute('data-theme', theme);
			currentTheme = theme;
		}

		// For Tailwind dark mode
		if (
			theme === 'dark' ||
			(theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
		) {
			html.classList.add('dark');
		} else {
			html.classList.remove('dark');
		}
	}

	function handleThemeChange(theme: 'light' | 'dark' | 'system') {
		preferences.theme = theme;
		applyTheme(theme);

		// Save to localStorage
		if (typeof window !== 'undefined') {
			localStorage.setItem('theme', theme);
		}

		toast.success(`Theme changed to ${theme === 'system' ? 'System' : theme} mode`);
	}

	function handleSaveProfile() {
		toast.success('Profile updated successfully!');
	}

	function handleSaveNotifications() {
		toast.success('Notification preferences saved!');
	}

	function handleSavePreferences() {
		toast.success('Preferences updated successfully!');
	}
</script>

<svelte:head>
	<title>Settings - Trust Banque</title>
</svelte:head>

<div>
	<!-- Page Header -->
	<div class="mb-8">
		<h1 class="text-3xl font-bold tracking-tight text-slate-900">Settings</h1>
		<p class="mt-2 text-slate-600">Manage your account settings and preferences.</p>
	</div>

	<div class="grid grid-cols-1 gap-8 lg:grid-cols-3">
		<!-- Settings Navigation -->
		<div class="lg:col-span-1">
			<div
				class="sticky top-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
			>
				<nav class="space-y-1 p-4">
					<a
						href="#profile"
						class="flex items-center gap-3 rounded-xl px-4 py-3 font-medium text-slate-700 transition-colors hover:bg-slate-50"
					>
						<span class="text-xl">👤</span>
						<span>Profile</span>
					</a>
					<a
						href="#notifications"
						class="flex items-center gap-3 rounded-xl px-4 py-3 font-medium text-slate-700 transition-colors hover:bg-slate-50"
					>
						<span class="text-xl">🔔</span>
						<span>Notifications</span>
					</a>
					<a
						href="#preferences"
						class="flex items-center gap-3 rounded-xl px-4 py-3 font-medium text-slate-700 transition-colors hover:bg-slate-50"
					>
						<span class="text-xl">⚙️</span>
						<span>Preferences</span>
					</a>
					<a
						href="#privacy"
						class="flex items-center gap-3 rounded-xl px-4 py-3 font-medium text-slate-700 transition-colors hover:bg-slate-50"
					>
						<span class="text-xl">🔒</span>
						<span>Privacy</span>
					</a>
				</nav>
			</div>
		</div>

		<!-- Settings Content -->
		<div class="space-y-8 lg:col-span-2">
			<!-- Profile Section -->
			<section
				id="profile"
				class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
			>
				<div class="border-b border-slate-200 p-6">
					<h3 class="text-lg font-bold text-slate-900">Profile Information</h3>
					<p class="mt-1 text-sm text-slate-500">Update your personal information</p>
				</div>
				<div class="space-y-6 p-6">
					<div class="mb-6 flex items-center gap-6">
						<div
							class="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-4xl font-bold text-white shadow-lg"
						>
							{profileData.firstName?.charAt(0)}{profileData.lastName?.charAt(0)}
						</div>
						<div>
							<button
								class="rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-emerald-600"
							>
								Change Photo
							</button>
							<p class="mt-2 text-xs text-slate-500">JPG, PNG or GIF. Max 2MB.</p>
						</div>
					</div>

					<div class="grid grid-cols-2 gap-4">
						<div>
							<label class="mb-2 block text-sm font-semibold text-slate-700">First Name</label>
							<input
								type="text"
								bind:value={profileData.firstName}
								class="block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 sm:text-sm"
							/>
						</div>
						<div>
							<label class="mb-2 block text-sm font-semibold text-slate-700">Last Name</label>
							<input
								type="text"
								bind:value={profileData.lastName}
								class="block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 sm:text-sm"
							/>
						</div>
					</div>

					<div>
						<label class="mb-2 block text-sm font-semibold text-slate-700">Email Address</label>
						<input
							type="email"
							bind:value={profileData.email}
							class="block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 sm:text-sm"
						/>
					</div>

					<div>
						<label class="mb-2 block text-sm font-semibold text-slate-700">Phone Number</label>
						<input
							type="tel"
							bind:value={profileData.phone}
							class="block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 sm:text-sm"
						/>
					</div>

					<div class="border-t border-slate-200 pt-4">
						<button
							on:click={handleSaveProfile}
							class="rounded-xl bg-emerald-500 px-6 py-3 font-semibold text-white transition-all hover:bg-emerald-600"
						>
							Save Changes
						</button>
					</div>
				</div>
			</section>

			<!-- Notifications Section -->
			<section
				id="notifications"
				class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
			>
				<div class="border-b border-slate-200 p-6">
					<h3 class="text-lg font-bold text-slate-900">Notification Preferences</h3>
					<p class="mt-1 text-sm text-slate-500">Choose how you want to be notified</p>
				</div>
				<div class="space-y-4 p-6">
					<div class="flex items-center justify-between rounded-xl bg-slate-50 p-4">
						<div class="flex items-center gap-4">
							<div
								class="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-xl"
							>
								📧
							</div>
							<div>
								<p class="font-semibold text-slate-900">Email Notifications</p>
								<p class="text-sm text-slate-500">Receive updates via email</p>
							</div>
						</div>
						<label class="relative inline-flex cursor-pointer items-center">
							<input type="checkbox" bind:checked={notifications.email} class="peer sr-only" />
							<div
								class="peer h-7 w-14 rounded-full bg-slate-200 peer-checked:bg-emerald-500 peer-focus:ring-4 peer-focus:ring-emerald-300 peer-focus:outline-none after:absolute after:top-0.5 after:left-[4px] after:h-6 after:w-6 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white"
							></div>
						</label>
					</div>

					<div class="flex items-center justify-between rounded-xl bg-slate-50 p-4">
						<div class="flex items-center gap-4">
							<div
								class="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-xl"
							>
								📱
							</div>
							<div>
								<p class="font-semibold text-slate-900">SMS Notifications</p>
								<p class="text-sm text-slate-500">Receive updates via text message</p>
							</div>
						</div>
						<label class="relative inline-flex cursor-pointer items-center">
							<input type="checkbox" bind:checked={notifications.sms} class="peer sr-only" />
							<div
								class="peer h-7 w-14 rounded-full bg-slate-200 peer-checked:bg-emerald-500 peer-focus:ring-4 peer-focus:ring-emerald-300 peer-focus:outline-none after:absolute after:top-0.5 after:left-[4px] after:h-6 after:w-6 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white"
							></div>
						</label>
					</div>

					<div class="flex items-center justify-between rounded-xl bg-slate-50 p-4">
						<div class="flex items-center gap-4">
							<div
								class="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-xl"
							>
								🔔
							</div>
							<div>
								<p class="font-semibold text-slate-900">Push Notifications</p>
								<p class="text-sm text-slate-500">Receive updates in the app</p>
							</div>
						</div>
						<label class="relative inline-flex cursor-pointer items-center">
							<input type="checkbox" bind:checked={notifications.push} class="peer sr-only" />
							<div
								class="peer h-7 w-14 rounded-full bg-slate-200 peer-checked:bg-emerald-500 peer-focus:ring-4 peer-focus:ring-emerald-300 peer-focus:outline-none after:absolute after:top-0.5 after:left-[4px] after:h-6 after:w-6 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white"
							></div>
						</label>
					</div>

					<div class="border-t border-slate-200 pt-4">
						<button
							on:click={handleSaveNotifications}
							class="rounded-xl bg-emerald-500 px-6 py-3 font-semibold text-white transition-all hover:bg-emerald-600"
						>
							Save Preferences
						</button>
					</div>
				</div>
			</section>

			<!-- Preferences Section with Working Theme -->
			<section
				id="preferences"
				class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
			>
				<div class="border-b border-slate-200 p-6">
					<h3 class="text-lg font-bold text-slate-900">App Preferences</h3>
					<p class="mt-1 text-sm text-slate-500">Customize your experience</p>
				</div>
				<div class="space-y-6 p-6">
					<div>
						<label class="mb-2 block text-sm font-semibold text-slate-700">Language</label>
						<select
							bind:value={preferences.language}
							class="block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 sm:text-sm"
						>
							<option value="en">English</option>
							<option value="es">Spanish</option>
							<option value="fr">French</option>
							<option value="de">German</option>
						</select>
					</div>

					<div>
						<label class="mb-2 block text-sm font-semibold text-slate-700">Currency</label>
						<select
							bind:value={preferences.currency}
							class="block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 sm:text-sm"
						>
							<option value="USD">USD - US Dollar</option>
							<option value="EUR">EUR - Euro</option>
							<option value="GBP">GBP - British Pound</option>
							<option value="CAD">CAD - Canadian Dollar</option>
						</select>
					</div>

					<div>
						<label class="mb-2 block text-sm font-semibold text-slate-700">Timezone</label>
						<select
							bind:value={preferences.timezone}
							class="block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 sm:text-sm"
						>
							<option value="America/New_York">Eastern Time (ET)</option>
							<option value="America/Chicago">Central Time (CT)</option>
							<option value="America/Denver">Mountain Time (MT)</option>
							<option value="America/Los_Angeles">Pacific Time (PT)</option>
						</select>
					</div>

					<div>
						<label class="mb-2 block text-sm font-semibold text-slate-700">Theme</label>
						<div class="grid grid-cols-3 gap-3">
							<button
								on:click={() => handleThemeChange('light')}
								class="rounded-xl border-2 p-4 text-center transition-all {preferences.theme ===
								'light'
									? 'border-emerald-500 bg-emerald-50'
									: 'border-slate-200 bg-slate-50 hover:border-emerald-300'}"
							>
								<span class="text-2xl">☀️</span>
								<p
									class="mt-2 text-sm font-semibold {preferences.theme === 'light'
										? 'text-emerald-600'
										: 'text-slate-700'}"
								>
									Light
								</p>
							</button>
							<button
								on:click={() => handleThemeChange('dark')}
								class="rounded-xl border-2 p-4 text-center transition-all {preferences.theme ===
								'dark'
									? 'border-emerald-500 bg-emerald-50'
									: 'border-slate-200 bg-slate-900 hover:border-emerald-300'}"
							>
								<span class="text-2xl">🌙</span>
								<p
									class="mt-2 text-sm font-semibold {preferences.theme === 'dark'
										? 'text-emerald-600'
										: 'text-white'}"
								>
									Dark
								</p>
							</button>
							<button
								on:click={() => handleThemeChange('system')}
								class="rounded-xl border-2 p-4 text-center transition-all {preferences.theme ===
								'system'
									? 'border-emerald-500 bg-emerald-50'
									: 'border-slate-200 bg-gradient-to-b from-slate-50 to-slate-900 hover:border-emerald-300'}"
							>
								<span class="text-2xl">🔄</span>
								<p
									class="mt-2 text-sm font-semibold {preferences.theme === 'system'
										? 'text-emerald-600'
										: 'text-slate-700'}"
								>
									System
								</p>
							</button>
						</div>
						{#if preferences.theme === 'system'}
							<p class="mt-2 text-center text-xs text-slate-500">
								Current: {currentTheme === 'dark' ? '🌙 Dark' : '☀️ Light'} mode (based on your device)
							</p>
						{/if}
					</div>

					<div class="border-t border-slate-200 pt-4">
						<button
							on:click={handleSavePreferences}
							class="rounded-xl bg-emerald-500 px-6 py-3 font-semibold text-white transition-all hover:bg-emerald-600"
						>
							Save Preferences
						</button>
					</div>
				</div>
			</section>
		</div>
	</div>
</div>

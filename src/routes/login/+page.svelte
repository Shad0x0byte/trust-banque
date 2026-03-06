<script lang="ts">
	// src/routes/login/+page.svelte
	// Login page — uses the central api/client.ts for the actual fetch
	// so the URL is always driven by VITE_API_URL in .env.

	import { goto } from '$app/navigation';
	import { auth } from '$lib/stores/auth';
	import { toast } from '$lib/stores/toast';
	import { login as apiLogin } from '$lib/api/client';
	import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';

	let email = '';
	let password = '';
	let rememberMe = false; // When true, store a longer-lived marker in localStorage
	let isLoading = false;
	let showPassword = false;
	let errors: { email?: string; password?: string; general?: string } = {};

	// ── Validation ────────────────────────────────────────────────────────
	function validateForm(): boolean {
		errors = {};
		let valid = true;

		if (!email) {
			errors.email = 'Email is required';
			valid = false;
		} else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
			errors.email = 'Please enter a valid email address';
			valid = false;
		}

		if (!password) {
			errors.password = 'Password is required';
			valid = false;
		}

		return valid;
	}

	// ── Submit ────────────────────────────────────────────────────────────
	async function handleSubmit(e: Event) {
		e.preventDefault();
		if (!validateForm()) return;

		isLoading = true;
		errors.general = undefined;

		try {
			const res = await apiLogin(email, password);

			if (res.success && res.data) {
				const { user, token } = res.data as any;

				// Store auth state; also persist a "remember me" flag if checked
				auth.setAuth(user, token);

				if (rememberMe) {
					// rememberMe stores a flag so the auth store knows to treat the
					// session as persistent (the JWT itself handles the actual expiry).
					if (typeof window !== 'undefined') {
						localStorage.setItem('remember_me', '1');
					}
				} else {
					if (typeof window !== 'undefined') {
						localStorage.removeItem('remember_me');
					}
				}

				toast.success('Welcome back!');

				// Role-based redirect
				if (user.role === 'admin') {
					goto('/admin');
				} else {
					goto('/dashboard');
				}
			} else {
				errors.general = res.error || 'Invalid email or password';
				toast.error(res.error || 'Login failed');
			}
		} catch {
			errors.general = 'Network error. Please try again.';
			toast.error('Connection failed. Please check your internet.');
		} finally {
			isLoading = false;
		}
	}
</script>

<svelte:head>
	<title>Sign In - Trust Banque</title>
</svelte:head>

<div
	class="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4"
>
	<!-- Background glows -->
	<div class="absolute inset-0 overflow-hidden">
		<div class="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl"></div>
		<div class="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl"></div>
	</div>

	<div class="relative w-full max-w-md">
		<!-- Logo -->
		<div class="mb-8 text-center">
			<a href="/" class="inline-flex items-center justify-center">
				<div
					class="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-2xl"
				>
					<span class="text-3xl">🏦</span>
				</div>
			</a>
			<h1 class="mt-4 text-2xl font-bold text-white">Welcome Back</h1>
			<p class="mt-2 text-slate-400">Sign in to access your account</p>
		</div>

		<!-- Login Card -->
		<div class="rounded-3xl border border-white/20 bg-white/95 p-8 shadow-2xl backdrop-blur-xl">
			{#if errors.general}
				<div class="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
					<span class="text-xl">❌</span>
					<div>
						<p class="text-sm font-medium text-red-800">Sign in failed</p>
						<p class="mt-1 text-sm text-red-600">{errors.general}</p>
					</div>
				</div>
			{/if}

			<!-- Use onsubmit (Svelte 5 syntax) -->
			<form onsubmit={handleSubmit} class="space-y-5">
				<!-- Email -->
				<div>
					<label class="mb-2 block text-sm font-medium text-slate-700">Email Address</label>
					<input
						type="email"
						bind:value={email}
						autocomplete="email"
						placeholder="you@example.com"
						class="block w-full rounded-xl border {errors.email
							? 'border-red-300'
							: 'border-slate-200'} bg-slate-50 px-4 py-3 text-sm transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
					/>
					{#if errors.email}
						<p class="mt-2 text-sm text-red-600">{errors.email}</p>
					{/if}
				</div>

				<!-- Password -->
				<div>
					<label class="mb-2 block text-sm font-medium text-slate-700">Password</label>
					<div class="relative">
						<input
							type={showPassword ? 'text' : 'password'}
							bind:value={password}
							autocomplete="current-password"
							placeholder="••••••••"
							class="block w-full rounded-xl border {errors.password
								? 'border-red-300'
								: 'border-slate-200'} bg-slate-50 px-4 py-3 pr-12 text-sm transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
						/>
						<!-- Toggle visibility -->
						<button
							type="button"
							onclick={() => (showPassword = !showPassword)}
							class="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600"
							aria-label={showPassword ? 'Hide password' : 'Show password'}
						>
							{#if showPassword}
								<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
									/>
								</svg>
							{:else}
								<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
									/>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
									/>
								</svg>
							{/if}
						</button>
					</div>
					{#if errors.password}
						<p class="mt-2 text-sm text-red-600">{errors.password}</p>
					{/if}

					<div class="mt-2 flex justify-end">
						<a
							href="#"
							class="text-sm font-medium text-emerald-600 hover:text-emerald-700 hover:underline"
						>
							Forgot password?
						</a>
					</div>
				</div>

				<!-- Remember Me — properly wired to rememberMe variable -->
				<div class="flex items-center">
					<input
						type="checkbox"
						id="remember"
						bind:checked={rememberMe}
						class="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
					/>
					<label for="remember" class="ml-2 block text-sm text-slate-600">
						Remember me for 30 days
					</label>
				</div>

				<!-- Submit -->
				<button
					type="submit"
					disabled={isLoading}
					class="flex w-full transform items-center justify-center rounded-xl border border-transparent bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg transition-all hover:scale-[1.02] hover:from-emerald-600 hover:to-emerald-700 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:outline-none active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
				>
					{#if isLoading}
						<LoadingSpinner size="sm" color="text-white" />
						<span class="ml-2">Signing in...</span>
					{:else}
						Sign In
					{/if}
				</button>
			</form>
		</div>

		<!-- Sign up link -->
		<p class="mt-8 text-center text-slate-400">
			Don't have an account?
			<a
				href="/signup"
				class="font-semibold text-emerald-400 hover:text-emerald-300 hover:underline"
			>
				Open one in minutes
			</a>
		</p>

		<!-- Security badge -->
		<div class="mt-4 flex items-center justify-center gap-2 text-sm text-slate-500">
			<span>🔒</span>
			<span>256-bit SSL Encrypted</span>
		</div>
	</div>
</div>

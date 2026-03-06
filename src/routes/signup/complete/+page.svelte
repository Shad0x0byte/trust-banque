<script lang="ts">
  import { goto } from '$app/navigation';
  import { auth } from '$lib/stores/auth';
  import type { AuthState } from '$lib/types';
  let authState: AuthState = { isAuthenticated: false, user: null, token: null, loading: false };
  auth.subscribe((s) => { authState = s; });
</script>
<svelte:head><title>Account Created - Trust Banque</title></svelte:head>
<div class="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4">
  <div class="max-w-md w-full text-center">
    <div class="bg-white rounded-2xl shadow-lg border border-slate-100 p-8">
      <div class="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg class="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
      </div>
      <h1 class="text-2xl font-bold text-slate-900 mb-2">Welcome to Trust Banque!</h1>
      <p class="text-slate-600 mb-6">Your account has been created{#if authState.user}, <strong>{authState.user.first_name} {authState.user.last_name}</strong>{/if}.</p>
      {#if authState.user}
        <div class="bg-slate-50 rounded-xl p-4 mb-6 text-left text-sm text-slate-600 space-y-2">
          <div class="flex justify-between"><span>Email</span><span class="font-medium text-slate-900">{authState.user.email}</span></div>
          <div class="flex justify-between"><span>Account</span><span class="font-medium text-slate-900">Personal Checking</span></div>
          <div class="flex justify-between"><span>Status</span><span class="font-medium text-green-600">Active ✓</span></div>
        </div>
      {/if}
      <button on:click={() => goto('/dashboard')} class="w-full py-3 px-6 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-colors">Go to Dashboard →</button>
    </div>
  </div>
</div>

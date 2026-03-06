<script lang="ts">
  // src/routes/admin/settings/+page.svelte
  // Admin settings — system configuration overview and admin account management.
  // In a POC context these values are informational; the real config lives in .env.

  import { toast }    from '$lib/stores/toast';
  import { auth }     from '$lib/stores/auth';
  import { changePassword } from '$lib/api/client';
  import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';

  let authState = $auth;
  auth.subscribe(s => { authState = s; });

  // ── Password change ───────────────────────────────────────────────────
  let pwData = { current: '', newPw: '', confirm: '' };
  let pwLoading = false;
  let pwErrors: string[] = [];

  async function handleChangePassword() {
    pwErrors = [];
    if (!pwData.current)  { pwErrors.push('Current password required'); }
    if (pwData.newPw.length < 8) { pwErrors.push('New password must be at least 8 characters'); }
    if (pwData.newPw !== pwData.confirm) { pwErrors.push('Passwords do not match'); }
    if (pwErrors.length) return;

    pwLoading = true;
    const res = await changePassword(pwData.current, pwData.newPw);
    pwLoading = false;

    if (res.success) {
      toast.success('Password updated successfully');
      pwData = { current: '', newPw: '', confirm: '' };
    } else {
      pwErrors = [res.error || 'Failed to update password'];
    }
  }

  // ── System config display ─────────────────────────────────────────────
  // These are read from the compiled env; actual values are set in .env
  const envConfig = [
    { key: 'API URL',         value: import.meta.env.VITE_API_URL || 'http://localhost/banking-api/public/api' },
    { key: 'Environment',     value: import.meta.env.MODE || 'development' },
    { key: 'JWT Expiry',      value: '24 hours' },
    { key: 'Default Page Size', value: '20 rows' },
    { key: 'Max Page Size',   value: '100 rows' },
  ];
</script>

<svelte:head>
  <title>Admin Settings — Trust Banque</title>
</svelte:head>

<div class="space-y-8">

  <div>
    <h1 class="text-2xl font-bold text-slate-900">Admin Settings</h1>
    <p class="mt-1 text-slate-500">System configuration and account management.</p>
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">

    <!-- Change Password -->
    <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 class="text-lg font-bold text-slate-900 mb-1">Change Password</h3>
      <p class="text-sm text-slate-500 mb-5">Update your admin account password.</p>

      {#if pwErrors.length}
        <div class="mb-4 rounded-xl border border-red-200 bg-red-50 p-4">
          {#each pwErrors as err}
            <p class="text-sm text-red-700">• {err}</p>
          {/each}
        </div>
      {/if}

      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">Current Password</label>
          <input type="password" bind:value={pwData.current}
            class="block w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-red-500 focus:ring-2 focus:ring-red-500/20 focus:outline-none" />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">New Password</label>
          <input type="password" bind:value={pwData.newPw}
            class="block w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-red-500 focus:ring-2 focus:ring-red-500/20 focus:outline-none" />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">Confirm New Password</label>
          <input type="password" bind:value={pwData.confirm}
            class="block w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-red-500 focus:ring-2 focus:ring-red-500/20 focus:outline-none" />
        </div>
        <button
          onclick={handleChangePassword}
          disabled={pwLoading}
          class="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50 transition-colors"
        >
          {#if pwLoading}<LoadingSpinner size="sm" color="text-white" />{/if}
          {pwLoading ? 'Updating…' : 'Update Password'}
        </button>
      </div>
    </div>

    <!-- System Config (read-only display) -->
    <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 class="text-lg font-bold text-slate-900 mb-1">System Configuration</h3>
      <p class="text-sm text-slate-500 mb-5">
        Read from <code class="bg-slate-100 px-1 rounded">.env</code>.
        Edit that file to change these values.
      </p>
      <div class="space-y-3">
        {#each envConfig as item}
          <div class="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0 last:pb-0">
            <span class="text-sm text-slate-500">{item.key}</span>
            <code class="text-sm font-mono bg-slate-50 border border-slate-200 px-2 py-0.5 rounded text-slate-700">{item.value}</code>
          </div>
        {/each}
      </div>
    </div>

    <!-- Deployment Checklist -->
    <div class="lg:col-span-2 rounded-2xl border border-amber-200 bg-amber-50 p-6">
      <h3 class="text-lg font-bold text-amber-900 mb-4 flex items-center gap-2">
        🚀 Deployment Checklist
      </h3>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-amber-800">
        {#each [
          ['Change JWT_SECRET in .env to a long random string (32+ chars)', false],
          ['Set CORS_ORIGIN in .env to your Vercel domain (e.g. https://app.trustbanque.com)', false],
          ['Set VITE_API_URL in frontend .env to your production API URL', false],
          ['Set APP_ENV=production in backend .env', false],
          ['Enable HTTPS on your shared host (free via Let\'s Encrypt / cPanel)', false],
          ['Remove or restrict hashgen.php and test.php from /public', false],
          ['Run schema.sql then seed_demo_data.sql in phpMyAdmin', true],
          ['Test login, transfer, and admin panel end-to-end', false],
        ] as [item, done]}
          <div class="flex items-start gap-2">
            <span class="{done ? 'text-emerald-600' : 'text-amber-500'}">{done ? '✓' : '○'}</span>
            <p>{item}</p>
          </div>
        {/each}
      </div>
    </div>

  </div>
</div>

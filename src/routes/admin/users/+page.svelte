<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { toast } from '$lib/stores/toast';
  import { formatCurrency, formatDate } from '$lib/utils/formatters';
  import { apiRequest } from '$lib/api/client';
  import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';

  let loading = true;
  let saving = false;
  let users: any[] = [];
  let searchQuery = '';
  let statusFilter = 'all';

  // Create user modal
  let showCreate = false;
  let newUser = { first_name: '', last_name: '', email: '', password: '', phone: '', role: 'user', status: 'active', initial_balance: '' };
  let createErrors: string[] = [];

  onMount(loadUsers);

  async function loadUsers() {
    loading = true;
    const res = await apiRequest<any>('/admin/users.php');
    loading = false;
    if (res.success && res.data) users = res.data.users;
    else toast.error(res.error || 'Failed to load users');
  }

  async function handleCreate() {
    createErrors = [];
    if (!newUser.first_name.trim()) createErrors.push('First name required');
    if (!newUser.last_name.trim())  createErrors.push('Last name required');
    if (!newUser.email.trim())      createErrors.push('Email required');
    if (newUser.password.length < 8) createErrors.push('Password must be at least 8 characters');
    if (createErrors.length) return;

    saving = true;
    const res = await apiRequest<any>('/admin/create_user.php', {
      method: 'POST',
      body: JSON.stringify({
        ...newUser,
        initial_balance: newUser.initial_balance ? parseFloat(newUser.initial_balance) : 0,
      }),
    });
    saving = false;

    if (res.success) {
      toast.success('User created successfully');
      showCreate = false;
      newUser = { first_name: '', last_name: '', email: '', password: '', phone: '', role: 'user', status: 'active', initial_balance: '' };
      await loadUsers();
      if (res.data?.user_id) goto(`/admin/users/${res.data.user_id}`);
    } else {
      createErrors = res.errors || [res.error || 'Failed to create user'];
    }
  }

  async function handleToggleStatus(user: any) {
    const newStatus = user.status === 'active' ? 'suspended' : 'active';
    const res = await apiRequest('/admin/user_update.php', {
      method: 'POST',
      body: JSON.stringify({ user_id: user.id, status: newStatus }),
    });
    if (res.success) {
      user.status = newStatus;
      users = [...users];
      toast.success(`User ${newStatus}`);
    } else toast.error('Failed to update status');
  }

  async function handleDelete(user: any) {
    if (!confirm(`Delete ${user.first_name} ${user.last_name}? This cannot be undone.`)) return;
    const res = await apiRequest('/admin/user_delete.php', {
      method: 'POST',
      body: JSON.stringify({ user_id: user.id }),
    });
    if (res.success) { toast.success('User deleted'); users = users.filter(u => u.id !== user.id); }
    else toast.error(res.error || 'Failed to delete user');
  }

  $: filtered = users.filter(u => {
    if (statusFilter !== 'all' && u.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return u.email?.toLowerCase().includes(q) || `${u.first_name} ${u.last_name}`.toLowerCase().includes(q);
    }
    return true;
  });

  function statusColor(s: string) {
    return s === 'active' ? 'bg-emerald-100 text-emerald-700'
         : s === 'pending' ? 'bg-amber-100 text-amber-700'
         : s === 'flagged' ? 'bg-red-100 text-red-700'
         : 'bg-slate-100 text-slate-700';
  }
</script>

<svelte:head><title>User Management — Trust Banque Admin</title></svelte:head>

<div class="space-y-6">

  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold text-slate-900">User Management</h1>
      <p class="mt-1 text-slate-500">{users.length} total users in database</p>
    </div>
    <button on:click={() => showCreate = true}
      class="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-emerald-700 transition-colors">
      <span class="text-base">➕</span> Create User
    </button>
  </div>

  <!-- Filters -->
  <div class="flex flex-col gap-3 sm:flex-row rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
    <input type="text" bind:value={searchQuery} placeholder="Search by name or email…"
      class="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none" />
    <select bind:value={statusFilter}
      class="rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-emerald-500 outline-none">
      <option value="all">All Status</option>
      <option value="active">Active</option>
      <option value="pending">Pending</option>
      <option value="flagged">Flagged</option>
      <option value="suspended">Suspended</option>
    </select>
    <button on:click={loadUsers} class="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
      🔄 Refresh
    </button>
  </div>

  <!-- Table -->
  <div class="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
    {#if loading}
      <div class="flex items-center justify-center py-20"><LoadingSpinner size="lg" /></div>
    {:else if filtered.length === 0}
      <div class="py-20 text-center">
        <p class="text-3xl mb-3">👥</p>
        <p class="font-medium text-slate-700">No users found</p>
        <p class="text-sm text-slate-400 mt-1">Try adjusting your filters or create a new user</p>
      </div>
    {:else}
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-slate-50 border-b border-slate-100">
            <tr>
              {#each ['User','Email','Balance','Role','Status','Joined','Actions'] as h}
                <th class="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">{h}</th>
              {/each}
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50">
            {#each filtered as user}
              <tr class="hover:bg-slate-50 transition-colors">
                <td class="px-5 py-4">
                  <div class="flex items-center gap-3">
                    <div class="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-xs font-bold text-white">
                      {user.first_name?.[0] ?? ''}{user.last_name?.[0] ?? ''}
                    </div>
                    <div>
                      <p class="text-sm font-semibold text-slate-900">{user.first_name} {user.last_name}</p>
                      <p class="text-xs text-slate-400">ID #{user.id}</p>
                    </div>
                  </div>
                </td>
                <td class="px-5 py-4 text-sm text-slate-600">{user.email}</td>
                <td class="px-5 py-4 text-sm font-semibold text-slate-900">{formatCurrency(parseFloat(user.account_balance ?? user.total_balance ?? 0))}</td>
                <td class="px-5 py-4">
                  <span class="rounded-full px-2.5 py-1 text-xs font-semibold capitalize {user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-700'}">{user.role}</span>
                </td>
                <td class="px-5 py-4">
                  <span class="rounded-full px-2.5 py-1 text-xs font-semibold capitalize {statusColor(user.status)}">{user.status}</span>
                </td>
                <td class="px-5 py-4 text-xs text-slate-400">{formatDate(user.created_at)}</td>
                <td class="px-5 py-4">
                  <div class="flex items-center gap-3">
                    <a href="/admin/users/{user.id}" class="text-xs font-semibold text-emerald-600 hover:underline">Manage</a>
                    <button on:click={() => handleToggleStatus(user)} class="text-xs font-semibold text-amber-600 hover:underline">
                      {user.status === 'active' ? 'Suspend' : 'Activate'}
                    </button>
                    <button on:click={() => handleDelete(user)} class="text-xs font-semibold text-red-500 hover:underline">Delete</button>
                  </div>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </div>

  <!-- Note about Edit -->
  <p class="text-xs text-slate-400 text-center">
    💡 Click <strong>Manage</strong> on any user to edit their profile, adjust balances, and post transactions.
  </p>
</div>

<!-- ── Create User Modal ──────────────────────────────────────────── -->
{#if showCreate}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
    <div class="w-full max-w-lg rounded-3xl bg-white shadow-2xl overflow-hidden">
      <!-- Header -->
      <div class="flex items-center justify-between border-b border-slate-100 px-6 py-5">
        <h3 class="text-lg font-bold text-slate-900">Create New User</h3>
        <button on:click={() => { showCreate = false; createErrors = []; }} class="text-slate-400 hover:text-slate-600 text-2xl font-light">×</button>
      </div>

      <!-- Body -->
      <div class="p-6 space-y-4 max-h-[70vh] overflow-y-auto">

        {#if createErrors.length}
          <div class="rounded-xl border border-red-200 bg-red-50 p-4">
            {#each createErrors as err}<p class="text-sm text-red-700">• {err}</p>{/each}
          </div>
        {/if}

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-semibold text-slate-600 mb-1.5">First Name *</label>
            <input type="text" bind:value={newUser.first_name} class="block w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none" placeholder="John"/>
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-600 mb-1.5">Last Name *</label>
            <input type="text" bind:value={newUser.last_name} class="block w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none" placeholder="Doe"/>
          </div>
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-600 mb-1.5">Email Address *</label>
          <input type="email" bind:value={newUser.email} class="block w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none" placeholder="john@example.com"/>
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-600 mb-1.5">Password * <span class="font-normal text-slate-400">(min 8 chars)</span></label>
          <input type="password" bind:value={newUser.password} class="block w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none" placeholder="••••••••"/>
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-600 mb-1.5">Phone</label>
          <input type="tel" bind:value={newUser.phone} class="block w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none" placeholder="(555) 123-4567"/>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-semibold text-slate-600 mb-1.5">Role</label>
            <select bind:value={newUser.role} class="block w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-emerald-500 outline-none">
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-600 mb-1.5">Status</label>
            <select bind:value={newUser.status} class="block w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-emerald-500 outline-none">
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-600 mb-1.5">Opening Balance <span class="font-normal text-slate-400">(optional)</span></label>
          <div class="relative">
            <span class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm">$</span>
            <input type="number" bind:value={newUser.initial_balance} step="0.01" min="0"
              class="block w-full rounded-xl border border-slate-200 pl-8 pr-4 py-2.5 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none" placeholder="0.00"/>
          </div>
          <p class="mt-1 text-xs text-slate-400">Creates an opening deposit transaction if amount > 0</p>
        </div>
      </div>

      <!-- Footer -->
      <div class="flex gap-3 border-t border-slate-100 px-6 py-5">
        <button on:click={() => { showCreate = false; createErrors = []; }}
          class="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
          Cancel
        </button>
        <button on:click={handleCreate} disabled={saving}
          class="flex-1 rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
          {#if saving}<LoadingSpinner size="sm" color="text-white" />{/if}
          {saving ? 'Creating…' : 'Create User'}
        </button>
      </div>
    </div>
  </div>
{/if}

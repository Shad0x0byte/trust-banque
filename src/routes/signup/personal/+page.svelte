<script lang="ts">
  import { goto } from '$app/navigation';
  import { toast } from '$lib/stores/toast';
  import { signup } from '$lib/stores/signup';
  import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
  import { validateEmail, validatePassword, validateDateOfBirth, validatePhone, validateSSN } from '$lib/utils/validators';

  let formData = { email: '', confirmEmail: '', password: '', confirmPassword: '', firstName: '', lastName: '', dateOfBirth: '', ssn: '', phone: '' };
  let errors: Record<string, string> = {};
  let showPassword = false; let showConfirmPassword = false; let showSSN = false;

  function formatSSN(v: string) { const c = v.replace(/\D/g,'').slice(0,9); if(c.length<=3)return c; if(c.length<=5)return `${c.slice(0,3)}-${c.slice(3)}`; return `${c.slice(0,3)}-${c.slice(3,5)}-${c.slice(5)}`; }
  function formatPhone(v: string) { const c = v.replace(/\D/g,'').slice(0,10); if(c.length<=3)return c; if(c.length<=6)return `(${c.slice(0,3)}) ${c.slice(3)}`; return `(${c.slice(0,3)}) ${c.slice(3,6)}-${c.slice(6)}`; }
  function handleSSNInput(e: Event) { formData.ssn = formatSSN((e.target as HTMLInputElement).value); }
  function handlePhoneInput(e: Event) { formData.phone = formatPhone((e.target as HTMLInputElement).value); }

  function validateStep(): boolean {
    errors = {}; let ok = true;
    const er = validateEmail(formData.email); if (!er.valid) { errors.email = er.error ?? 'Invalid email'; ok = false; }
    if (formData.email !== formData.confirmEmail) { errors.confirmEmail = 'Emails do not match'; ok = false; }
    const pr = validatePassword(formData.password); if (!pr.valid) { errors.password = pr.error ?? 'Invalid password'; ok = false; }
    if (formData.password !== formData.confirmPassword) { errors.confirmPassword = 'Passwords do not match'; ok = false; }
    if (!formData.firstName.trim()) { errors.firstName = 'First name is required'; ok = false; }
    if (!formData.lastName.trim()) { errors.lastName = 'Last name is required'; ok = false; }
    const dr = validateDateOfBirth(formData.dateOfBirth); if (!dr.valid) { errors.dateOfBirth = dr.error ?? 'Invalid DOB'; ok = false; }
    const sr = validateSSN(formData.ssn); if (!sr.valid) { errors.ssn = sr.error ?? 'Invalid SSN'; ok = false; }
    const phr = validatePhone(formData.phone); if (!phr.valid) { errors.phone = phr.error ?? 'Invalid phone'; ok = false; }
    return ok;
  }

  function handleContinue() {
    if (!validateStep()) { toast.error('Please fix the errors above'); return; }
    signup.save({ email: formData.email, password: formData.password, firstName: formData.firstName, lastName: formData.lastName, dateOfBirth: formData.dateOfBirth, ssn: formData.ssn, phone: formData.phone });
    goto('/signup/address');
  }
</script>

<svelte:head><title>Personal Information - Trust Banque</title></svelte:head>

<div class="min-h-screen bg-slate-50">
  <header class="bg-white border-b border-slate-200">
    <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <a href="/" class="flex items-center gap-2 mb-4"><div class="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center"><span class="text-lg">🏦</span></div><span class="font-bold text-lg text-slate-900">Trust Banque</span></a>
      <div class="flex items-center justify-between text-sm">
        <div class="flex items-center gap-2"><div class="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold">✓</div><span class="text-slate-500">Account Type</span></div>
        <div class="flex-1 mx-3 h-0.5 bg-emerald-300"></div>
        <div class="flex items-center gap-2"><div class="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold">2</div><span class="font-medium text-slate-900">Personal Info</span></div>
        <div class="flex-1 mx-3 h-0.5 bg-slate-200"></div>
        <div class="flex items-center gap-2"><div class="w-8 h-8 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center font-bold">3</div><span class="text-slate-500">Address</span></div>
      </div>
    </div>
  </header>

  <main class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
    <div class="bg-white rounded-2xl shadow-lg border border-slate-100 p-8">
      <div class="text-center mb-8"><h1 class="text-2xl font-bold text-slate-900">Personal Information</h1><p class="text-slate-600 mt-2">We need this to verify your identity</p></div>

      <div class="space-y-6">
        <div class="space-y-4">
          <h3 class="font-semibold text-slate-900 border-b border-slate-200 pb-2">Contact</h3>
          <div class="grid md:grid-cols-2 gap-4">
            <div><label class="block text-sm font-medium text-slate-700 mb-1">Email *</label><input type="email" bind:value={formData.email} class="block w-full rounded-lg border {errors.email ? 'border-red-300' : 'border-slate-300'} py-2.5 px-4 sm:text-sm" placeholder="you@example.com"/>{#if errors.email}<p class="mt-1 text-sm text-red-600">{errors.email}</p>{/if}</div>
            <div><label class="block text-sm font-medium text-slate-700 mb-1">Confirm Email *</label><input type="email" bind:value={formData.confirmEmail} class="block w-full rounded-lg border {errors.confirmEmail ? 'border-red-300' : 'border-slate-300'} py-2.5 px-4 sm:text-sm" placeholder="you@example.com"/>{#if errors.confirmEmail}<p class="mt-1 text-sm text-red-600">{errors.confirmEmail}</p>{/if}</div>
          </div>
          <div><label class="block text-sm font-medium text-slate-700 mb-1">Phone *</label><input type="tel" value={formData.phone} on:input={handlePhoneInput} class="block w-full rounded-lg border {errors.phone ? 'border-red-300' : 'border-slate-300'} py-2.5 px-4 sm:text-sm" placeholder="(555) 123-4567"/>{#if errors.phone}<p class="mt-1 text-sm text-red-600">{errors.phone}</p>{/if}</div>
        </div>

        <div class="space-y-4">
          <h3 class="font-semibold text-slate-900 border-b border-slate-200 pb-2">Personal Details</h3>
          <div class="grid md:grid-cols-2 gap-4">
            <div><label class="block text-sm font-medium text-slate-700 mb-1">First Name *</label><input type="text" bind:value={formData.firstName} class="block w-full rounded-lg border {errors.firstName ? 'border-red-300' : 'border-slate-300'} py-2.5 px-4 sm:text-sm" placeholder="John"/>{#if errors.firstName}<p class="mt-1 text-sm text-red-600">{errors.firstName}</p>{/if}</div>
            <div><label class="block text-sm font-medium text-slate-700 mb-1">Last Name *</label><input type="text" bind:value={formData.lastName} class="block w-full rounded-lg border {errors.lastName ? 'border-red-300' : 'border-slate-300'} py-2.5 px-4 sm:text-sm" placeholder="Doe"/>{#if errors.lastName}<p class="mt-1 text-sm text-red-600">{errors.lastName}</p>{/if}</div>
          </div>
          <div><label class="block text-sm font-medium text-slate-700 mb-1">Date of Birth *</label><input type="date" bind:value={formData.dateOfBirth} class="block w-full rounded-lg border {errors.dateOfBirth ? 'border-red-300' : 'border-slate-300'} py-2.5 px-4 sm:text-sm"/>{#if errors.dateOfBirth}<p class="mt-1 text-sm text-red-600">{errors.dateOfBirth}</p>{/if}</div>
          <div><label class="block text-sm font-medium text-slate-700 mb-1">SSN *</label><div class="relative"><input type={showSSN ? 'text' : 'password'} value={formData.ssn} on:input={handleSSNInput} class="block w-full rounded-lg border {errors.ssn ? 'border-red-300' : 'border-slate-300'} py-2.5 px-4 pr-16 sm:text-sm" placeholder="XXX-XX-XXXX"/><button type="button" on:click={() => showSSN = !showSSN} class="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">{showSSN ? 'Hide' : 'Show'}</button></div>{#if errors.ssn}<p class="mt-1 text-sm text-red-600">{errors.ssn}</p>{/if}</div>
        </div>

        <div class="space-y-4">
          <h3 class="font-semibold text-slate-900 border-b border-slate-200 pb-2">Password</h3>
          <div><label class="block text-sm font-medium text-slate-700 mb-1">Password *</label><div class="relative"><input type={showPassword ? 'text' : 'password'} bind:value={formData.password} class="block w-full rounded-lg border {errors.password ? 'border-red-300' : 'border-slate-300'} py-2.5 px-4 pr-16 sm:text-sm" placeholder="••••••••"/><button type="button" on:click={() => showPassword = !showPassword} class="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">{showPassword ? 'Hide' : 'Show'}</button></div>{#if errors.password}<p class="mt-1 text-sm text-red-600">{errors.password}</p>{:else}<p class="mt-1 text-xs text-slate-500">Min 8 chars, uppercase, lowercase, number, special (!@#$%^&*)</p>{/if}</div>
          <div><label class="block text-sm font-medium text-slate-700 mb-1">Confirm Password *</label><div class="relative"><input type={showConfirmPassword ? 'text' : 'password'} bind:value={formData.confirmPassword} class="block w-full rounded-lg border {errors.confirmPassword ? 'border-red-300' : 'border-slate-300'} py-2.5 px-4 pr-16 sm:text-sm" placeholder="••••••••"/><button type="button" on:click={() => showConfirmPassword = !showConfirmPassword} class="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">{showConfirmPassword ? 'Hide' : 'Show'}</button></div>{#if errors.confirmPassword}<p class="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>{/if}</div>
        </div>
      </div>

      <div class="mt-8 flex justify-between">
        <a href="/signup" class="px-6 py-3 rounded-xl border border-slate-300 text-sm font-medium text-slate-600 hover:bg-slate-50">← Back</a>
        <button on:click={handleContinue} class="px-6 py-3 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700">Continue →</button>
      </div>
    </div>
  </main>
</div>

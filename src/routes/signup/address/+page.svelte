<script lang="ts">
  import { goto } from '$app/navigation';
  import { toast } from '$lib/stores/toast';
  import { signup } from '$lib/stores/signup';
  import { auth } from '$lib/stores/auth';
  import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';

  let formData = { street: '', apartment: '', city: '', state: '', zip: '' };
  let errors: Record<string, string> = {};
  let isLoading = false;
  let photoFile: File | null = null;
  let photoPreview: string | null = null;

  const states = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'];

  function handlePhotoChange(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      if (file.size > 3 * 1024 * 1024) { toast.error('Photo must be under 3MB'); return; }
      photoFile = file;
      const reader = new FileReader();
      reader.onload = (ev) => { photoPreview = ev.target?.result as string; };
      reader.readAsDataURL(file);
    }
  }

  function validateStep(): boolean {
    errors = {}; let ok = true;
    if (!formData.street.trim()) { errors.street = 'Street address is required'; ok = false; }
    if (!formData.city.trim())   { errors.city   = 'City is required'; ok = false; }
    if (!formData.state)         { errors.state  = 'State is required'; ok = false; }
    if (!/^\d{5}(-\d{4})?$/.test(formData.zip)) { errors.zip = 'Valid ZIP code required'; ok = false; }
    return ok;
  }

  async function handleSubmit() {
    if (!validateStep()) { toast.error('Please fix the errors above'); return; }
    isLoading = true;

    let sd: any;
    const unsub = signup.subscribe((s) => { sd = s; }); unsub();

    if (!sd.email || !sd.password) {
      toast.error('Missing personal info — go back to step 2');
      isLoading = false; return;
    }

    // Build multipart form data so we can include the photo
    const formPayload = new FormData();
    formPayload.append('email', sd.email);
    formPayload.append('password', sd.password);
    formPayload.append('first_name', sd.firstName);
    formPayload.append('last_name', sd.lastName);
    formPayload.append('phone', sd.phone || '');
    formPayload.append('date_of_birth', sd.dateOfBirth || '');
    formPayload.append('address_street', formData.street + (formData.apartment ? ' ' + formData.apartment : ''));
    formPayload.append('address_city', formData.city);
    formPayload.append('address_state', formData.state);
    formPayload.append('address_zip', formData.zip);
    if (photoFile) formPayload.append('picture', photoFile);

    try {
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost/banking-api/public/api';
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const resp = await fetch(`${API_BASE}/auth/register.php`, { method: 'POST', headers, body: formPayload });
      const data = await resp.json();

      isLoading = false;
      if (data.success && data.data) {
        auth.setAuth(data.data.user, data.data.token);
        signup.reset();
        toast.success('Account created! Welcome to Trust Banque.');
        goto('/signup/complete');
      } else {
        toast.error(data.errors?.join(', ') || data.error || 'Registration failed');
      }
    } catch (err) {
      isLoading = false;
      toast.error('Network error. Please try again.');
    }
  }
</script>

<svelte:head><title>Address - Trust Banque</title></svelte:head>

<div class="min-h-screen bg-slate-50">
  <header class="bg-white border-b border-slate-200">
    <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <a href="/" class="flex items-center gap-2 mb-4"><div class="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center"><span class="text-lg">🏦</span></div><span class="font-bold text-lg text-slate-900">Trust Banque</span></a>
      <div class="flex items-center justify-between text-sm">
        <div class="flex items-center gap-2"><div class="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold">✓</div><span class="text-slate-500">Account Type</span></div>
        <div class="flex-1 mx-3 h-0.5 bg-emerald-300"></div>
        <div class="flex items-center gap-2"><div class="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold">✓</div><span class="text-slate-500">Personal Info</span></div>
        <div class="flex-1 mx-3 h-0.5 bg-emerald-300"></div>
        <div class="flex items-center gap-2"><div class="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold">3</div><span class="font-medium text-slate-900">Address & Photo</span></div>
      </div>
    </div>
  </header>

  <main class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
    <div class="bg-white rounded-2xl shadow-lg border border-slate-100 p-8">
      <div class="text-center mb-8"><h1 class="text-2xl font-bold text-slate-900">Address & Profile Photo</h1><p class="text-slate-600 mt-2">Required for regulatory compliance</p></div>

      <div class="space-y-4">
        <!-- Passport Photo Upload -->
        <div class="rounded-xl border-2 border-dashed border-slate-200 p-6">
          <h3 class="font-semibold text-slate-900 mb-1">Passport / ID Photograph <span class="text-slate-400 font-normal text-sm">(optional)</span></h3>
          <p class="text-xs text-slate-500 mb-4">Upload a clear photo of your face. This will be displayed on your profile. JPG, PNG, max 3MB.</p>
          <div class="flex items-center gap-6">
            <div class="w-24 h-24 rounded-full border-2 border-slate-200 overflow-hidden bg-slate-100 flex items-center justify-center flex-shrink-0">
              {#if photoPreview}
                <img src={photoPreview} alt="Preview" class="w-full h-full object-cover" />
              {:else}
                <span class="text-3xl">📷</span>
              {/if}
            </div>
            <div>
              <label class="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors">
                <span>Choose Photo</span>
                <input type="file" accept="image/*" on:change={handlePhotoChange} class="hidden" />
              </label>
              {#if photoFile}
                <p class="mt-2 text-xs text-emerald-700 font-medium">✓ {photoFile.name}</p>
              {/if}
            </div>
          </div>
        </div>

        <!-- Address fields -->
        <div><label class="block text-sm font-medium text-slate-700 mb-1">Street Address *</label><input type="text" bind:value={formData.street} class="block w-full rounded-lg border {errors.street ? 'border-red-300' : 'border-slate-300'} py-2.5 px-4 sm:text-sm" placeholder="123 Main St"/>{#if errors.street}<p class="mt-1 text-sm text-red-600">{errors.street}</p>{/if}</div>
        <div><label class="block text-sm font-medium text-slate-700 mb-1">Apartment / Suite (optional)</label><input type="text" bind:value={formData.apartment} class="block w-full rounded-lg border border-slate-300 py-2.5 px-4 sm:text-sm" placeholder="Apt 4B"/></div>
        <div class="grid md:grid-cols-3 gap-4">
          <div class="md:col-span-1"><label class="block text-sm font-medium text-slate-700 mb-1">City *</label><input type="text" bind:value={formData.city} class="block w-full rounded-lg border {errors.city ? 'border-red-300' : 'border-slate-300'} py-2.5 px-4 sm:text-sm"/>{#if errors.city}<p class="mt-1 text-sm text-red-600">{errors.city}</p>{/if}</div>
          <div><label class="block text-sm font-medium text-slate-700 mb-1">State *</label><select bind:value={formData.state} class="block w-full rounded-lg border {errors.state ? 'border-red-300' : 'border-slate-300'} py-2.5 px-4 sm:text-sm"><option value="">Select</option>{#each states as s}<option value={s}>{s}</option>{/each}</select>{#if errors.state}<p class="mt-1 text-sm text-red-600">{errors.state}</p>{/if}</div>
          <div><label class="block text-sm font-medium text-slate-700 mb-1">ZIP *</label><input type="text" bind:value={formData.zip} class="block w-full rounded-lg border {errors.zip ? 'border-red-300' : 'border-slate-300'} py-2.5 px-4 sm:text-sm" placeholder="10001" maxlength="10"/>{#if errors.zip}<p class="mt-1 text-sm text-red-600">{errors.zip}</p>{/if}</div>
        </div>
      </div>

      <div class="mt-8 flex justify-between">
        <a href="/signup/personal" class="px-6 py-3 rounded-xl border border-slate-300 text-sm font-medium text-slate-600 hover:bg-slate-50">← Back</a>
        <button on:click={handleSubmit} disabled={isLoading} class="px-6 py-3 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2">
          {#if isLoading}<LoadingSpinner size="sm" color="text-white"/>{/if}
          {isLoading ? 'Creating account...' : 'Create Account →'}
        </button>
      </div>
    </div>
  </main>
</div>

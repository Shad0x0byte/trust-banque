<script lang="ts">
  import { goto } from '$app/navigation';
  import { toast } from '$lib/stores/toast';
  import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
  
  let verificationCode = ['', '', '', '', '', ''];
  let isLoading = false;
  let isResending = false;
  let countdown = 30;
  
  // Auto-focus next input
  function handleInput(e: Event, index: number) {
    const target = e.target as HTMLInputElement;
    if (target.value.length === 1 && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`);
      nextInput?.focus();
    }
  }
  
  // Handle backspace
  function handleKeydown(e: KeyboardEvent, index: number) {
    if (e.key === 'Backspace' && !verificationCode[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`);
      prevInput?.focus();
    }
  }
  
  // Handle paste
  function handlePaste(e: ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData?.getData('text') || '';
    const digits = pasted.replace(/\D/g, '').slice(0, 6);
    
    for (let i = 0; i < digits.length && i < 6; i++) {
      verificationCode[i] = digits[i];
    }
    
    // Focus last filled input
    const lastFilled = Math.min(digits.length, 5);
    const lastInput = document.getElementById(`code-${lastFilled}`);
    lastInput?.focus();
  }
  
  async function handleVerify() {
    const code = verificationCode.join('');
    if (code.length !== 6) {
      toast.error('Please enter the complete 6-digit code');
      return;
    }
    
    isLoading = true;
    
    // Simulate API verification
    setTimeout(() => {
      isLoading = false;
      toast.success('Identity verified!');
      goto('/signup/complete');
    }, 1500);
  }
  
  async function handleResend() {
    isResending = true;
    countdown = 30;
    
    // Simulate resend
    toast.info('New code sent to your email');
    
    const timer = setInterval(() => {
      countdown--;
      if (countdown <= 0) {
        clearInterval(timer);
        isResending = false;
      }
    }, 1000);
  }
</script>

<svelte:head>
  <title>Verify Identity - Trust Banque</title>
</svelte:head>

<div class="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4">
  <div class="max-w-md w-full">
    <div class="bg-white rounded-2xl shadow-lg border border-slate-100 p-8">
      <div class="text-center mb-8">
        <div class="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <span class="text-3xl">📧</span>
        </div>
        <h1 class="text-2xl font-bold text-slate-900">Verify Your Identity</h1>
        <p class="text-slate-600 mt-2">
          We sent a 6-digit code to your email.<br/>Enter it below to continue.
        </p>
      </div>
      
      <!-- Verification Code Input -->
      <div class="mb-6">
        <div class="flex justify-center gap-2">
          {#each verificationCode as digit, i}
            <input
              id="code-{i}"
              type="text"
              maxlength="1"
              bind:value={verificationCode[i]}
              on:input={(e) => handleInput(e, i)}
              on:keydown={(e) => handleKeydown(e, i)}
              on:paste={handlePaste}
              class="w-12 h-14 text-center text-2xl font-bold border-2 border-slate-300 rounded-lg focus:border-accent focus:ring-accent outline-none transition-colors"
            />
          {/each}
        </div>
      </div>
      
      <!-- Verify Button -->
      <button
        on:click={handleVerify}
        disabled={isLoading || verificationCode.join('').length !== 6}
        class="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed mb-4"
      >
        {#if isLoading}
          <LoadingSpinner size="sm" color="text-white" />
        {:else}
          Verify Identity
        {/if}
      </button>
      
      <!-- Resend Code -->
      <div class="text-center">
        {#if isResending}
          <p class="text-sm text-slate-600">
            Resend code in <span class="font-bold text-accent">{countdown}</span> seconds
          </p>
        {:else}
          <p class="text-sm text-slate-600">
            Didn't receive the code?
            <button on:click={handleResend} class="text-accent font-medium hover:underline ml-1">
              Resend
            </button>
          </p>
        {/if}
      </div>
      
      <!-- Security Notice -->
      <div class="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
        <div class="flex items-start gap-3">
          <span class="text-xl">🔒</span>
          <div>
            <p class="text-xs font-medium text-slate-700">Why We Verify</p>
            <p class="text-xs text-slate-500 mt-1">
              This helps us prevent fraud and protect your account. We'll never ask for this code over the phone.
            </p>
          </div>
        </div>
      </div>
    </div>
    
    <p class="text-center mt-6">
      <a href="/signup/address" class="text-sm text-slate-600 hover:text-slate-900">
        ← Back to Address
      </a>
    </p>
  </div>
</div>
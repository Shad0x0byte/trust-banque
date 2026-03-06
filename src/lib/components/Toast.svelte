<script lang="ts">
  import { toast } from '$lib/stores/toast';
  import type { ToastMessage } from '$lib/types';
  
  let toasts: ToastMessage[] = [];
  
  toast.subscribe((value) => {
    toasts = value;
  });
  
  function getIcon(type: string) {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '📢';
    }
  }
  
  function getColors(type: string) {
    switch (type) {
      case 'success': return 'bg-green-50 border-green-200 text-green-800';
      case 'error': return 'bg-red-50 border-red-200 text-red-800';
      case 'warning': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'info': return 'bg-blue-50 border-blue-200 text-blue-800';
      default: return 'bg-slate-50 border-slate-200 text-slate-800';
    }
  }
</script>

<div class="fixed bottom-4 right-4 z-50 space-y-2 max-w-sm">
  {#each toasts as toastItem (toastItem.id)}
    <div 
      class="flex items-start gap-3 p-4 rounded-lg border shadow-lg animate-slide-up {getColors(toastItem.type)}"
    >
      <span class="text-xl">{getIcon(toastItem.type)}</span>
      <div class="flex-1">
        <p class="text-sm font-medium">{toastItem.message}</p>
      </div>
      <button 
        on:click={() => toast.remove(toastItem.id)}
        class="text-slate-400 hover:text-slate-600"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  {/each}
</div>
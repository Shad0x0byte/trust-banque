<script lang="ts">
  const year = new Date().getFullYear();
</script>

<footer class="mt-16 border-t border-slate-200/80 bg-white/60 backdrop-blur-sm">
  <div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
    <div class="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
      <!-- Brand -->
      <div class="flex items-center gap-2.5">
        <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 shadow-sm">
          <span class="text-sm">🏦</span>
        </div>
        <div>
          <p class="text-sm font-semibold text-slate-800" style="font-family: 'Sora', sans-serif;">Trust Banque</p>
          <p class="text-xs text-slate-400">Secure Banking Platform</p>
        </div>
      </div>

      <!-- Links -->
      <nav class="flex flex-wrap justify-center gap-x-6 gap-y-2">
        {#each [['Privacy Policy','#'],['Terms of Service','#'],['Security','#'],['Help Center','#'],['Contact','#']] as [label, href]}
          <a {href} class="text-xs text-slate-400 transition-colors hover:text-emerald-600">{label}</a>
        {/each}
      </nav>

      <!-- FDIC badge -->
      <div class="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5">
        <span class="text-xs font-bold text-slate-500">FDIC</span>
        <div class="h-3 w-px bg-slate-300"></div>
        <span class="text-xs text-slate-400">Insured up to $250K</span>
      </div>
    </div>

    <!-- Bottom bar -->
    <div class="mt-6 flex flex-col items-center gap-2 border-t border-slate-100 pt-6 sm:flex-row sm:justify-between">
      <p class="text-xs text-slate-400">© {year} Trust Banque. All rights reserved. Member FDIC.</p>
      <p class="text-xs text-slate-400">🔒 256-bit SSL encryption · Regulated by FDIC · Equal Housing Lender</p>
    </div>
  </div>
</footer>

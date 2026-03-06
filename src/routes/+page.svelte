<script lang="ts">
  import { auth } from '$lib/stores/auth';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';

  let scrolled = false;
  let mobileOpen = false;
  let openFaq = -1;

  onMount(() => {
    auth.loadFromStorage();
    const fn = () => { scrolled = window.scrollY > 30; };
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  });

  // function handleGetStarted() {
  //   const unsub = auth.subscribe(s => {
  //     if (!s.loading) { unsub(); goto(s.isAuthenticated ? '/dashboard' : '/signup'); }
  //   });
  // }

  const features = [
    { icon: '🛡️', title: 'Bank-Grade Security', desc: '256-bit SSL, two-factor authentication, and 24/7 fraud monitoring keep your money safe.' },
    { icon: '💸', title: 'Zero-Fee Transfers', desc: 'Send money instantly between accounts. External wires clear within one business day at no cost.' },
    { icon: '📈', title: '2.5% APY Savings', desc: 'Grow your savings faster. No minimum balance, no lock-in period, interest credited daily.' },
    { icon: '📱', title: 'Always Available', desc: 'Full-featured web and mobile banking. Manage everything from any device, any time.' },
    { icon: '💳', title: 'Smart Debit Cards', desc: 'Instant freeze, spending limits, virtual cards, and real-time alerts on every purchase.' },
    { icon: '🤝', title: '24/7 Live Support', desc: 'Real people, real answers. Chat, phone, or email — average response under 2 minutes.' },
  ];

  const faqs = [
    { q: 'Is Trust Banque FDIC insured?', a: 'Yes. All deposits are insured up to $250,000 per depositor through our FDIC-member banking partner.' },
    { q: 'Are there monthly fees?', a: 'None. No monthly maintenance fees, no minimum balance requirements, no hidden charges. Ever.' },
    { q: 'How long do transfers take?', a: 'Internal transfers are instant. External ACH transfers clear within 1–2 business days.' },
    { q: 'How do I contact support?', a: 'Our team is available 24/7 via live chat in your dashboard, by phone at 1-800-TRUST-BQ, or email at support@trustbanque.com.' },
    { q: 'Can I have multiple accounts?', a: 'Yes. You can open checking and savings accounts. Savings accounts earn 2.5% APY with no minimums.' },
    { q: 'Is my data private?', a: 'Absolutely. We never sell your data. All personal information is encrypted at rest and in transit.' },
  ];
</script>

<svelte:head>
  <title>Trust Banque — Modern Online Banking</title>
</svelte:head>

<div class="min-h-screen bg-white">

  <!-- Navbar -->
  <nav class="fixed inset-x-0 top-0 z-50 transition-all duration-300 {scrolled ? 'bg-white/95 backdrop-blur shadow-sm border-b border-slate-200' : 'bg-transparent'}">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="flex h-16 items-center justify-between">
        <a href="/" class="flex items-center gap-2.5">
          <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 shadow">
            <span class="text-lg">🏦</span>
          </div>
          <span class="text-xl font-bold {scrolled ? 'text-slate-900' : 'text-white'}">Trust Banque</span>
        </a>
        <div class="hidden md:flex items-center gap-8">
          {#each [['#features','Features'],['#accounts','Accounts'],['#how-it-works','How It Works'],['#faq','FAQ']] as [href,label]}
            <a {href} class="text-sm font-medium transition-colors {scrolled ? 'text-slate-600 hover:text-slate-900' : 'text-white/80 hover:text-white'}">{label}</a>
          {/each}
          <a href="/login" class="text-sm font-medium transition-colors {scrolled ? 'text-slate-600 hover:text-slate-900' : 'text-white/80 hover:text-white'}">Sign In</a>
          <a href="/signup" class="rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors">Open Account</a>
        </div>
        <button class="md:hidden {scrolled ? 'text-slate-700' : 'text-white'}" on:click={() => mobileOpen = !mobileOpen}>
          <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {#if mobileOpen}<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            {:else}<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>{/if}
          </svg>
        </button>
      </div>
    </div>
    {#if mobileOpen}
      <div class="md:hidden bg-white border-b border-slate-100 px-4 pb-5 pt-2 space-y-1">
        {#each [['#features','Features'],['#accounts','Accounts'],['#how-it-works','How It Works'],['#faq','FAQ']] as [href,label]}
          <a {href} class="block py-2.5 text-sm font-medium text-slate-700" on:click={() => mobileOpen = false}>{label}</a>
        {/each}
        <a href="/login" class="block py-2.5 text-sm font-medium text-slate-700">Sign In</a>
        <a href="/signup" class="block mt-2 rounded-xl bg-emerald-600 py-3 text-center text-sm font-semibold text-white">Open Account</a>
      </div>
    {/if}
  </nav>

  <!-- Hero -->
  <section class="relative flex min-h-screen items-center bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 overflow-hidden">
    <div class="absolute inset-0 pointer-events-none">
      <div class="absolute -top-40 -right-40 h-[600px] w-[600px] rounded-full bg-emerald-500/10 blur-3xl"></div>
      <div class="absolute bottom-0 left-0 h-80 w-80 rounded-full bg-emerald-400/5 blur-3xl"></div>
    </div>
    <div class="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-32 text-center w-full">
      <div class="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-sm font-medium text-emerald-400 mb-8">
        <span class="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
        FDIC Insured · Zero Fees · 2.5% APY Savings
      </div>
      <h1 class="text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-tight tracking-tight mb-6">
        Banking That Works<br/><span class="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">For You</span>
      </h1>
      <p class="mx-auto max-w-2xl text-xl text-slate-300 leading-relaxed mb-10">
        Open a free account in minutes. No hidden fees, no minimum balance, and industry-leading security. Everything you need to take control of your finances.
      </p>
      <div class="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
        <a href="/signup" class="w-full sm:w-auto rounded-xl bg-emerald-500 px-10 py-4 text-lg font-bold text-white shadow-xl shadow-emerald-500/25 hover:bg-emerald-400 transition-all hover:-translate-y-0.5">
          Open Free Account
        </a>
        <a href="/login" class="w-full sm:w-auto rounded-xl border border-white/20 bg-white/5 px-10 py-4 text-lg font-semibold text-white backdrop-blur hover:bg-white/10 transition-all">
          Sign In →
        </a>
      </div>
      <div class="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-400 mb-20">
        <span class="flex items-center gap-2"><span class="text-emerald-400">✓</span> FDIC Insured up to $250K</span>
        <span class="flex items-center gap-2"><span class="text-emerald-400">✓</span> 256-bit SSL Encryption</span>
        <span class="flex items-center gap-2"><span class="text-emerald-400">✓</span> No credit check required</span>
      </div>
      <div class="grid grid-cols-3 gap-8 border-t border-white/10 pt-10 max-w-xl mx-auto">
        <div><p class="text-4xl font-bold text-emerald-400">2M+</p><p class="mt-1 text-sm text-slate-400">Customers</p></div>
        <div><p class="text-4xl font-bold text-emerald-400">$5B+</p><p class="mt-1 text-sm text-slate-400">Assets Secured</p></div>
        <div><p class="text-4xl font-bold text-emerald-400">99.9%</p><p class="mt-1 text-sm text-slate-400">Uptime SLA</p></div>
      </div>
    </div>
  </section>

  <!-- Features -->
  <section id="features" class="py-24 bg-slate-50">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-16">
        <p class="text-sm font-semibold uppercase tracking-wider text-emerald-600 mb-3">Why Trust Banque</p>
        <h2 class="text-4xl font-bold text-slate-900">Everything you need, nothing you don't</h2>
        <p class="mt-4 text-lg text-slate-500 max-w-2xl mx-auto">Modern banking features built around your life — not around our profits.</p>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {#each features as f}
          <div class="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all">
            <div class="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-3xl">{f.icon}</div>
            <h3 class="mb-2 text-lg font-bold text-slate-900">{f.title}</h3>
            <p class="text-sm leading-relaxed text-slate-500">{f.desc}</p>
          </div>
        {/each}
      </div>
    </div>
  </section>

  <!-- Accounts -->
  <section id="accounts" class="py-24 bg-white">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-16">
        <p class="text-sm font-semibold uppercase tracking-wider text-emerald-600 mb-3">Our Products</p>
        <h2 class="text-4xl font-bold text-slate-900">Choose your account</h2>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        <div class="rounded-3xl border-2 border-slate-100 p-8 hover:border-slate-200 transition-colors">
          <div class="text-4xl mb-5">💳</div>
          <h3 class="text-2xl font-bold text-slate-900 mb-2">Checking Account</h3>
          <p class="text-slate-500 mb-6 text-sm">For everyday spending and payments. No minimum balance, no monthly fees.</p>
          <ul class="space-y-3 mb-8">
            {#each ['No monthly fees','Free debit card','Unlimited transfers','Mobile check deposit','Real-time notifications'] as item}
              <li class="flex items-center gap-2.5 text-sm text-slate-700"><span class="font-bold text-emerald-500">✓</span>{item}</li>
            {/each}
          </ul>
          <a href="/signup" class="block rounded-xl bg-slate-900 py-3.5 text-center text-sm font-semibold text-white hover:bg-slate-700 transition-colors">Open Checking Account</a>
        </div>
        <div class="rounded-3xl border-2 border-emerald-500 bg-gradient-to-br from-emerald-50 to-white p-8 relative">
          <span class="absolute top-6 right-6 rounded-full bg-emerald-500 px-3 py-1 text-xs font-bold text-white">BEST VALUE</span>
          <div class="text-4xl mb-5">📈</div>
          <h3 class="text-2xl font-bold text-slate-900 mb-2">Savings Account</h3>
          <p class="text-slate-500 mb-2 text-sm">Grow your wealth with industry-leading interest rates.</p>
          <p class="mb-6 text-5xl font-bold text-emerald-600">2.5%<span class="text-base font-medium text-slate-400 ml-1">APY</span></p>
          <ul class="space-y-3 mb-8">
            {#each ['No minimum balance','2.5% annual yield','Daily interest accrual','Instant transfer to checking','FDIC insured'] as item}
              <li class="flex items-center gap-2.5 text-sm text-slate-700"><span class="font-bold text-emerald-500">✓</span>{item}</li>
            {/each}
          </ul>
          <a href="/signup" class="block rounded-xl bg-emerald-600 py-3.5 text-center text-sm font-semibold text-white hover:bg-emerald-700 transition-colors">Open Savings Account</a>
        </div>
      </div>
    </div>
  </section>

  <!-- How It Works -->
  <section id="how-it-works" class="py-24 bg-slate-900">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-16">
        <p class="text-sm font-semibold uppercase tracking-wider text-emerald-400 mb-3">Simple Process</p>
        <h2 class="text-4xl font-bold text-white">Open your account in minutes</h2>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-10">
        {#each [['01','Create Account','Sign up with your basic information. No credit check, no paperwork.'],['02','Verify Identity','Quick, secure identity check to protect you and meet banking regulations.'],['03','Start Banking','Fund your account and start enjoying fee-free banking immediately.']] as [n,t,d]}
          <div class="text-center">
            <div class="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-2xl font-bold text-emerald-400">{n}</div>
            <h3 class="mb-3 text-xl font-bold text-white">{t}</h3>
            <p class="text-slate-400 leading-relaxed">{d}</p>
          </div>
        {/each}
      </div>
      <div class="mt-14 text-center">
        <a href="/signup" class="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-10 py-4 text-lg font-bold text-white hover:bg-emerald-400 transition-colors shadow-xl shadow-emerald-500/20">
          Get Started Free →
        </a>
      </div>
    </div>
  </section>

  <!-- FAQ -->
  <section id="faq" class="py-24 bg-white">
    <div class="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-16">
        <p class="text-sm font-semibold uppercase tracking-wider text-emerald-600 mb-3">FAQ</p>
        <h2 class="text-4xl font-bold text-slate-900">Common questions</h2>
      </div>
      <div class="space-y-3">
        {#each faqs as faq, i}
          <div class="overflow-hidden rounded-2xl border border-slate-100">
            <button class="flex w-full items-center justify-between p-6 text-left hover:bg-slate-50 transition-colors" on:click={() => openFaq = openFaq === i ? -1 : i}>
              <span class="font-semibold text-slate-900">{faq.q}</span>
              <span class="ml-4 flex-shrink-0 text-xl text-slate-400">{openFaq === i ? '−' : '+'}</span>
            </button>
            {#if openFaq === i}
              <div class="px-6 pb-6 text-sm leading-relaxed text-slate-500">{faq.a}</div>
            {/if}
          </div>
        {/each}
      </div>
    </div>
  </section>

  <!-- CTA -->
  <section class="py-24 bg-gradient-to-br from-emerald-600 to-emerald-800">
    <div class="mx-auto max-w-4xl px-4 text-center">
      <h2 class="text-4xl font-bold text-white mb-4">Ready to bank smarter?</h2>
      <p class="mb-10 text-xl text-emerald-100">Join over 2 million customers who trust us with their finances.</p>
      <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
        <a href="/signup" class="w-full sm:w-auto rounded-xl bg-white px-10 py-4 text-lg font-bold text-emerald-700 hover:bg-emerald-50 transition-colors shadow-xl">Open Free Account</a>
        <a href="/login" class="w-full sm:w-auto rounded-xl border-2 border-white/40 px-10 py-4 text-lg font-semibold text-white hover:bg-white/10 transition-colors">Sign In</a>
      </div>
    </div>
  </section>

  <!-- Footer -->
  <footer class="bg-slate-900 text-slate-400">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
      <div class="grid grid-cols-1 gap-10 md:grid-cols-4 mb-12">
        <div>
          <div class="mb-4 flex items-center gap-2">
            <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-sm">🏦</div>
            <span class="text-lg font-bold text-white">Trust Banque</span>
          </div>
          <p class="text-sm leading-relaxed">Modern online banking built on trust, transparency, and technology.</p>
        </div>
        <div>
          <h4 class="mb-4 text-xs font-semibold uppercase tracking-wider text-white">Products</h4>
          <ul class="space-y-2 text-sm">
            <li><a href="/signup" class="hover:text-white transition-colors">Checking Account</a></li>
            <li><a href="/signup" class="hover:text-white transition-colors">Savings Account</a></li>
            <li><a href="/signup" class="hover:text-white transition-colors">Debit Cards</a></li>
            <li><a href="/signup" class="hover:text-white transition-colors">Transfers</a></li>
          </ul>
        </div>
        <div>
          <h4 class="mb-4 text-xs font-semibold uppercase tracking-wider text-white">Company</h4>
          <ul class="space-y-2 text-sm">
            <li><a href="#features" class="hover:text-white transition-colors">About Us</a></li>
            <li><a href="#features" class="hover:text-white transition-colors">Careers</a></li>
            <li><a href="#faq" class="hover:text-white transition-colors">Help Center</a></li>
            <li><a href="#faq" class="hover:text-white transition-colors">Contact Us</a></li>
          </ul>
        </div>
        <div>
          <h4 class="mb-4 text-xs font-semibold uppercase tracking-wider text-white">Legal</h4>
          <ul class="space-y-2 text-sm">
            <li><a href="#" class="hover:text-white transition-colors">Privacy Policy</a></li>
            <li><a href="#" class="hover:text-white transition-colors">Terms of Service</a></li>
            <li><a href="#" class="hover:text-white transition-colors">Cookie Policy</a></li>
            <li><a href="#" class="hover:text-white transition-colors">Security</a></li>
          </ul>
        </div>
      </div>
      <div class="flex flex-col items-center justify-between gap-4 border-t border-slate-800 pt-8 text-sm md:flex-row">
        <p>© 2026 Trust Banque. All rights reserved.</p>
        <div class="flex items-center gap-6">
          <span class="flex items-center gap-1.5"><span class="text-emerald-400">🏛️</span>FDIC Member</span>
          <span class="flex items-center gap-1.5"><span class="text-emerald-400">🔒</span>SSL Secured</span>
          <span class="flex items-center gap-1.5"><span class="text-emerald-400">✓</span>Equal Housing</span>
        </div>
      </div>
    </div>
  </footer>
</div>

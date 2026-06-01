<div
  class="fixed inset-0 z-50 flex items-center justify-center bg-white"
  role="status"
  aria-live="polite"
  aria-label="Loading Bloom"
>
  <div class="flex w-full max-w-[220px] flex-col items-center gap-7 px-6">
    <img
      src="/BloomLogo.png"
      alt="Bloom"
      class="h-16 w-auto object-contain"
      draggable="false"
    />

    <div class="h-1 w-full overflow-hidden rounded-full bg-slate-100">
      <div class="loading-bar h-full rounded-full bg-pink-600"></div>
    </div>
  </div>
</div>

<style>
  .loading-bar {
    width: 45%;
    animation: loading-slide 1.1s ease-in-out infinite;
  }

  @keyframes loading-slide {
    0% {
      transform: translateX(-120%);
    }

    50% {
      transform: translateX(85%);
    }

    100% {
      transform: translateX(235%);
    }
  }
</style>

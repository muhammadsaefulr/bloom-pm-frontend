<script lang="ts">
    import { ArrowRight } from "@lucide/svelte";
</script>

<div
    class="mt-8 bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-gray-100 p-3 flex items-center gap-3"
>
    <!-- Gradient Sparkle Icon -->
    <div class="w-9 h-9 flex items-center justify-center shrink-0">
        <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none">
            <defs>
                <linearGradient
                    id="sparkle-gradient"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                >
                    <stop offset="0%" style="stop-color:#A855F7" />
                    <stop offset="50%" style="stop-color:#6366F1" />
                    <stop offset="100%" style="stop-color:#3B82F6" />
                </linearGradient>
            </defs>
            <path
                d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z"
                fill="url(#sparkle-gradient)"
            />
            <path
                d="M19 15L19.75 17.25L22 18L19.75 18.75L19 21L18.25 18.75L16 18L18.25 17.25L19 15Z"
                fill="url(#sparkle-gradient)"
                opacity="0.7"
            />
            <path
                d="M5 3L5.5 4.5L7 5L5.5 5.5L5 7L4.5 5.5L3 5L4.5 4.5L5 3Z"
                fill="url(#sparkle-gradient)"
                opacity="0.5"
            />
        </svg>
    </div>

    <!-- Input -->
    <input
        type="text"
        placeholder="Ask or search for anything. Use @ to tag a file or collection."
        class="flex-1 text-sm text-gray-700 placeholder:text-gray-400 outline-none bg-transparent font-medium"
    />

    <!-- Submit Button -->
    <button
        class="w-9 h-9 flex items-center justify-center bg-gradient-to-br from-teal-400 to-cyan-500 hover:from-teal-500 hover:to-cyan-600 rounded-full transition-all text-white shadow-sm hover:shadow-md"
    >
        <ArrowRight class="w-4 h-4" />
    </button>
</div>

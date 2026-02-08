<script lang="ts">
    import type { MeetingSummary } from "../types/dashboard.types.ts";
    import { Sparkles } from "@lucide/svelte";

    export let meeting: MeetingSummary;
</script>

<div
    class="bg-white border border-gray-100 shadow-sm rounded-2xl p-5 h-full relative hover:shadow-md transition-shadow"
>
    <!-- Header Label -->
    <div class="flex items-center gap-2 mb-4">
        <Sparkles class="w-4 h-4 text-gray-400" />
        <span class="text-md font-medium text-gray-500"
            >Summarize your last meeting</span
        >
    </div>

    <!-- Meeting Info -->
    <div class="flex items-center gap-4">
        <img
            src={meeting.avatar}
            alt="Meeting host"
            class="w-21 rounded-xl object-cover border border-gray-100 shrink-0"
        />
        <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2 mb-0.5">
                {#if meeting.type === "Zoom"}
                    <div
                        class="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center shrink-0"
                    >
                        <svg
                            class="w-5 h-5 text-white"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                        >
                            <path
                                d="M4 5h11c.55 0 1 .45 1 1v7c0 .55-.45 1-1 1H4c-.55 0-1-.45-1-1V6c0-.55.45-1 1-1zm16 2v5l-3-2.5V9.5L20 7z"
                            />
                        </svg>
                    </div>
                {:else}
                    <div
                        class="w-5 h-5 bg-green-500 rounded flex items-center justify-center shrink-0"
                    >
                        <svg
                            class="w-3 h-3 text-white"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                        >
                            <path
                                d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2z"
                            />
                        </svg>
                    </div>
                {/if}
                <h3 class="font-bold text-gray-900 text-lg truncate">
                    {meeting.title}
                </h3>
            </div>
            <p class="text-md text-gray-500 mt-2">{meeting.date}</p>
        </div>
    </div>
</div>

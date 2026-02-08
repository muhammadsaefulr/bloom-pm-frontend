<script lang="ts">
    import { EllipsisVertical } from "@lucide/svelte";
    import type { FileItem } from "../types/dashboard.types.ts";
    import { cn } from "$lib/utils/cn.ts";

    export let files: FileItem[] = [];

    // Brand icon components for different file types
    const brandIcons: Record<
        string,
        { icon: string; bgColor: string; textColor: string }
    > = {
        miro: {
            icon: "🟡",
            bgColor: "bg-yellow-100",
            textColor: "text-yellow-600",
        },
        figma: {
            icon: "🎨",
            bgColor: "bg-purple-100",
            textColor: "text-purple-600",
        },
        pdf: {
            icon: "📄",
            bgColor: "bg-red-100",
            textColor: "text-red-600",
        },
        doc: {
            icon: "📝",
            bgColor: "bg-blue-100",
            textColor: "text-blue-600",
        },
        default: {
            icon: "📁",
            bgColor: "bg-gray-100",
            textColor: "text-gray-600",
        },
    };

    function getIcon(type: string) {
        return brandIcons[type] || brandIcons.default;
    }
</script>

<div
    class="bg-[#FEF9EE] rounded-2xl p-5 relative overflow-hidden h-full border border-yellow-100/50"
>
    <!-- Header -->
    <div class="flex justify-between items-start mb-5">
        <div class="flex items-center gap-2.5">
            <div
                class="w-6 h-6 bg-yellow-200/60 rounded-lg flex items-center justify-center"
            >
                <svg
                    class="w-4 h-4 text-yellow-700"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                >
                    <path
                        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                    />
                    <polyline points="14 2 14 8 20 8" />
                </svg>
            </div>
            <h3 class="font-semibold text-yellow-900 text-base">
                Previously viewed files
            </h3>
        </div>
        <button
            class="text-yellow-700/60 hover:text-yellow-800 p-1 rounded-lg hover:bg-yellow-200/40 transition-colors"
        >
            <EllipsisVertical class="w-5 h-5" />
        </button>
    </div>

    <!-- File List -->
    <div class="space-y-2 relative z-10">
        {#each files as file}
            <div
                class="flex items-center gap-3 group cursor-pointer py-1 hover:bg-yellow-100/40 -mx-2 px-2 rounded-lg transition-colors"
            >
                <!-- Brand Icon -->
                <div
                    class={cn(
                        "w-5 h-5 rounded-lg flex items-center justify-center shrink-0 text-base",
                        getIcon(file.type).bgColor,
                    )}
                >
                    {#if file.type === "miro"}
                        <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none">
                            <rect
                                width="24"
                                height="24"
                                rx="4"
                                fill="#FFD02F"
                            />
                            <path
                                d="M6.5 7H8.5L10.5 12L12.5 7H14.5L16.5 12L18.5 7H20.5L17 17H15L13 12L11 17H9L5.5 7H7.5"
                                fill="#050038"
                            />
                        </svg>
                    {:else if file.type === "figma"}
                        <svg class="w-5 h-5" viewBox="0 0 24 24">
                            <path
                                d="M8 24c2.208 0 4-1.792 4-4v-4H8c-2.208 0-4 1.792-4 4s1.792 4 4 4z"
                                fill="#0ACF83"
                            />
                            <path
                                d="M4 12c0-2.208 1.792-4 4-4h4v8H8c-2.208 0-4-1.792-4-4z"
                                fill="#A259FF"
                            />
                            <path
                                d="M4 4c0-2.208 1.792-4 4-4h4v8H8C5.792 8 4 6.208 4 4z"
                                fill="#F24E1E"
                            />
                            <path
                                d="M12 0h4c2.208 0 4 1.792 4 4s-1.792 4-4 4h-4V0z"
                                fill="#FF7262"
                            />
                            <path
                                d="M20 12c0 2.208-1.792 4-4 4s-4-1.792-4-4 1.792-4 4-4 4 1.792 4 4z"
                                fill="#1ABCFE"
                            />
                        </svg>
                    {:else if file.type === "pdf"}
                        <div
                            class="w-6 h-6 bg-red-500 rounded text-white text-[8px] font-bold flex items-center justify-center"
                        >
                            PDF
                        </div>
                    {:else}
                        <span>{getIcon(file.type).icon}</span>
                    {/if}
                </div>
                <span
                    class="text-sm font-medium text-yellow-900 group-hover:text-yellow-950 truncate"
                >
                    {file.title}
                </span>
            </div>
        {/each}
    </div>
</div>

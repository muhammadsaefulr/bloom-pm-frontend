<script lang="ts">
    import {
        Search,
        ChevronRight,
        Zap,
        Plus,
        Clock,
        Circle,
    } from "@lucide/svelte";
    import type { Task } from "../types/dashboard.types.ts";
    import { cn } from "$lib/utils/cn.ts";
    import { FileText as FileTextIcon } from "@lucide/svelte";

    export let tasks: Task[] = [];

    // Priority dot colors based on task type
    function getPriorityDot(task: Task) {
        if (task.isMeeting) return "bg-blue-400";
        if (task.status === "Urgent") return "bg-red-500";
        if (task.status === "In progress") return "bg-yellow-400";
        return "bg-blue-400";
    }

    // Status badge styling
    function getStatusBadge(status: string) {
        switch (status) {
            case "Urgent":
                return {
                    color: "bg-red-50 text-red-600 border-red-200",
                    dotColor: "bg-red-500",
                };
            case "In progress":
                return {
                    color: "bg-blue-50 text-blue-600 border-blue-200",
                    dotColor: "bg-blue-500",
                };
            case "To do":
                return {
                    color: "bg-gray-50 text-gray-600 border-gray-200",
                    dotColor: "bg-gray-400",
                };
            default:
                return {
                    color: "bg-gray-50 text-gray-600 border-gray-200",
                    dotColor: "bg-gray-400",
                };
        }
    }

    function getTagColor(tag: string) {
        if (tag === "By today") return "bg-red-50 text-red-600 border-red-200";
        if (tag === "By tomorrow")
            return "bg-emerald-50 text-emerald-600 border-emerald-200";
        return "bg-gray-100 text-gray-500 border-gray-200";
    }
</script>

<div class="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
    <!-- Header -->
    <div class="flex items-center justify-between mb-5">
        <div class="flex items-center gap-4">
            <!-- Title -->
            <div class="flex items-center gap-2">
                <FileTextIcon class="w-5 h-5 text-gray-700" />
                <h3 class="font-semibold text-gray-900 text-base">My Tasks</h3>
                <span class="text-gray-400 text-sm font-medium"
                    >{tasks.length}</span
                >
            </div>

            <!-- Search Input -->
            <div class="relative hidden md:block">
                <Search
                    class="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                    type="text"
                    placeholder="Search for name..."
                    class="pl-10 pr-10 py-2 bg-gray-50 rounded-full text-sm border border-transparent focus:border-gray-200 focus:ring-0 focus:bg-white w-56 transition-colors placeholder:text-gray-400"
                />
                <button
                    class="absolute right-2 top-1/2 -translate-y-1/2 bg-gray-200 hover:bg-gray-300 rounded-full p-1 transition-colors"
                >
                    <ChevronRight class="w-3 h-3 text-gray-600" />
                </button>
            </div>
        </div>

        <!-- Prioritize Button -->
        <button
            class="flex items-center gap-2 px-4 py-2 rounded-full border border-purple-200 bg-purple-50/50 text-purple-600 hover:bg-purple-100 transition-colors"
        >
            <Zap class="w-4 h-4" />
            <span class="text-sm font-medium">Prioritize Tasks</span>
        </button>
    </div>

    <!-- Task List -->
    <div class="space-y-0.5">
        {#each tasks as task}
            <div
                class="flex items-center justify-between py-3.5 px-3 hover:bg-gray-50 rounded-xl group transition-colors cursor-pointer -mx-1"
            >
                <div class="flex items-center gap-3.5">
                    <!-- Priority Dot -->
                    <div
                        class={cn(
                            "w-2 h-2 rounded-full shrink-0",
                            getPriorityDot(task),
                        )}
                    ></div>
                    <span
                        class="text-sm font-medium text-gray-700 group-hover:text-gray-900"
                        >{task.title}</span
                    >
                </div>

                <div class="flex items-center gap-2.5">
                    <!-- Time Badge -->
                    {#if task.time}
                        <div
                            class="flex items-center gap-1.5 text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full"
                        >
                            <Clock class="w-3 h-3" />
                            <span>{task.time}</span>
                        </div>
                    {/if}

                    <!-- Join Button for Meetings -->
                    {#if task.isMeeting}
                        <button
                            class="flex items-center gap-1.5 bg-indigo-100 text-indigo-600 px-3 py-1 rounded-full text-xs font-semibold hover:bg-indigo-200 transition-colors"
                        >
                            <Plus class="w-3 h-3" />
                            Join now
                        </button>
                    {/if}

                    <!-- Status Badge -->
                    {#if task.status && !task.isMeeting}
                        <div
                            class={cn(
                                "flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border",
                                getStatusBadge(task.status).color,
                            )}
                        >
                            <div
                                class={cn(
                                    "w-1.5 h-1.5 rounded-full",
                                    getStatusBadge(task.status).dotColor,
                                )}
                            ></div>
                            <span>{task.status}</span>
                        </div>
                    {/if}

                    <!-- Tags -->
                    {#if task.tags}
                        {#each task.tags as tag}
                            <div
                                class={cn(
                                    "flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border",
                                    getTagColor(tag),
                                )}
                            >
                                <Clock class="w-3 h-3" />
                                <span>{tag}</span>
                            </div>
                        {/each}
                    {/if}
                </div>
            </div>
        {/each}
    </div>
</div>

<script lang="ts">
    import { authStore } from "$modules/auth/stores/authStore.js";

    export let name: string = "";

    $: displayName = name || $authStore?.user?.name || "User";
</script>

<div class="mb-10">
    <div class="flex items-baseline gap-1">
        <h1
            class="text-[42px] font-semibold text-[#2D9CDB] tracking-tight leading-tight"
        >
            Welcome, {displayName}!
        </h1>
        <span class="text-[42px] ml-1">👋</span>
    </div>
    <h2
        class="text-[42px] font-semibold text-gray-800 tracking-tight leading-tight"
    >
        How can I help you today?
    </h2>
</div>

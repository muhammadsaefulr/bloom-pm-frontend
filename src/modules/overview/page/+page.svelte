<script lang="ts">
    import WelcomeHeader from "../components/WelcomeHeader.svelte";
    import QuickActions from "../components/QuickActions.svelte";
    import RecentFilesCard from "$modules/dashboard/components/RecentFilesCard.svelte";
    import MeetingSummaryCard from "$modules/dashboard/components/MeetingSummaryCard.svelte";
    import TaskList from "$modules/dashboard/components/TaskList.svelte";
    import CommandBar from "$modules/dashboard/components/CommandBar.svelte";
    import { getDashboardData } from "$modules/dashboard/hooks/useDashboardQuery.js";

    const data = getDashboardData();
</script>

<div class="max-w-5xl mx-auto py-6">
    <!-- Welcome Header -->
    <WelcomeHeader />

    <!-- Top Widgets Grid -->
    <div class="grid grid-cols-2 gap-4 pb-8">
        <!-- Recent Files (Left Column) -->
        <div class="">
            <RecentFilesCard files={data.recentFiles} />
        </div>

        <!-- Right Column -->
        <div>
            <MeetingSummaryCard meeting={data.lastMeeting} />
        </div>
    </div>

    <!-- Task List -->
    <TaskList tasks={data.myTasks} />

    <!-- Command Bar -->
    <CommandBar />
</div>

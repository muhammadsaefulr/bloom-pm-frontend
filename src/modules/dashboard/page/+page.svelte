<script lang="ts">
    import { getDashboardData } from "../hooks/useDashboardQuery.ts";
    import WelcomeHeader from "../components/WelcomeHeader.svelte";
    import RecentFilesCard from "../components/RecentFilesCard.svelte";
    import MeetingSummaryCard from "../components/MeetingSummaryCard.svelte";
    import SuggestedTaskCard from "../components/SuggestedTaskCard.svelte";
    import TaskList from "../components/TaskList.svelte";
    import CommandBar from "../components/CommandBar.svelte";

    const data = getDashboardData();
</script>

<div class="max-w-5xl mx-auto py-6">
    <!-- Welcome Header -->
    <WelcomeHeader name={data.user.name} />

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

<script lang="ts">
  import {
    Bold,
    ChevronDown,
    Clipboard,
    Code2,
    Copy,
    GripVertical,
    Heading1,
    Heading2,
    Heading3,
    Italic,
    Link,
    List,
    ListChecks,
    ListOrdered,
    PanelRightClose,
    Palette,
    Plus,
    Quote,
    RotateCcw,
    Search,
    Sparkles,
    Trash2,
    Type,
    Underline as UnderlineIcon,
    UserPlus,
    X,
  } from "@lucide/svelte";
  import { Editor } from "@tiptap/core";
  import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
  import { NodeSelection, TextSelection } from "@tiptap/pm/state";
  import type { EditorView } from "@tiptap/pm/view";
  import StarterKit from "@tiptap/starter-kit";
  import Color from "@tiptap/extension-color";
  import Placeholder from "@tiptap/extension-placeholder";
  import TaskItem from "@tiptap/extension-task-item";
  import TaskList from "@tiptap/extension-task-list";
  import { TextStyle } from "@tiptap/extension-text-style";
  import Underline from "@tiptap/extension-underline";
  import { createEventDispatcher, onDestroy, onMount, tick } from "svelte";
  import type { TeamMember } from "$modules/teams/types/index.js";
  import { fallbackAvatarUrl, safeAvatarUrl } from "$lib/utils/avatar.js";
  // @ts-expect-error module resolution
  import { cn } from "$lib/utils/cn.ts";
  import type { Task, TaskAssignee, TaskCategory, TaskID, TaskPriority, TaskStatus } from "../stores/taskStore.js";
  import { taskCategories, updateTask } from "../stores/taskStore.js";

  export let task: Task | null = null;
  export let teamMembers: TeamMember[] = [];

  const dispatch = createEventDispatcher<{
    close: void;
  }>();
  const statuses: TaskStatus[] = ["To do", "Doing", "Done"];
  const priorities: TaskPriority[] = ["Urgent", "Normal", "Low"];
  const visualBlockTypes = ["taskItem", "listItem", "heading", "paragraph", "blockquote"];
  const blockMenuWidth = 256;
  const blockMenuGap = 12;
  const estimatedBlockMenuHeight = 380;
  const estimatedTurnIntoMenuHeight = 320;

  type BlockTarget = {
    pos: number;
    node: ProseMirrorNode;
    dom: HTMLElement;
  };

  type DraggedBlock = {
    pos: number;
    node: ProseMirrorNode;
  };

  let editorElement: HTMLDivElement;
  let editorSectionElement: HTMLElement;
  let assigneePickerElement: HTMLDivElement;
  let editor: Editor | null = null;
  let isMounted = false;
  let lastTaskId: TaskID | null = null;
  let showBlockOptions = false;
  let showInsertOptions = false;
  let showColorOptions = false;
  let showTurnIntoOptions = false;
  let showBlockHandle = false;
  let blockOptionTop = 0;
  let blockMenuLeft = 0;
  let blockMenuTop = 0;
  let turnIntoMenuTop = 0;
  let activeBlockPos: number | null = null;
  let draggedBlock: DraggedBlock | null = null;
  let dropIndicatorLeft = 0;
  let dropIndicatorTop: number | null = null;
  let dropIndicatorWidth = 0;
  let dropTargetPos: number | null = null;
  let selectedAssigneeIds: string[] = [];
  let showAssigneePicker = false;
  let assigneeSearch = "";

  const colorOptions = [
    { label: "Default", value: "" },
    { label: "Gray", value: "#6b7280" },
    { label: "Pink", value: "#db2777" },
    { label: "Amber", value: "#d97706" },
    { label: "Emerald", value: "#059669" },
    { label: "Blue", value: "#2563eb" },
  ];

  $: memberOptions = teamMembers
    .filter((member) => member.user?.id && member.user?.name)
    .map((member) => ({
      id: member.user!.id,
      name: member.user!.name,
      email: member.user!.email,
      avatarUrl: safeAvatarUrl(member.user!.name, member.user!.avatar_url),
    }));

  $: selectedAssigneeIds = task?.assignees?.map((assignee) => assignee.id) ?? [];
  $: selectedAssignees = memberOptions.filter((member) => selectedAssigneeIds.includes(member.id));
  $: filteredAssigneeOptions = memberOptions.filter((member) => {
    const keyword = assigneeSearch.trim().toLowerCase();
    if (!keyword) return true;

    return `${member.name} ${member.email ?? ""}`.toLowerCase().includes(keyword);
  });

  $: if (editor && task && task.id !== lastTaskId) {
    lastTaskId = task.id;
    editor.commands.setContent(task.content || "", { emitUpdate: false });
  }

  $: if (isMounted && task && editorElement && !editor) {
    void initializeEditor();
  }

  $: if (isMounted && !task && editor) {
    editor.destroy();
    editor = null;
    lastTaskId = null;
  }

  function persist(patch: Partial<Task>) {
    if (!task) return;
    updateTask(task.id, patch);
  }

  function updateOwner(ownerId: string) {
    const owner = memberOptions.find((member) => member.id === ownerId);
    persist({ ownerId, owner: owner?.name ?? "Unassigned" });
  }

  function getEditorView(): EditorView | null {
    if (!editor || editor.isDestroyed) return null;

    try {
      return editor.view;
    } catch {
      return null;
    }
  }

  function syncAssigneesFromSelection() {
    if (!task) return;

    const selectedMembers = memberOptions.filter((member) => selectedAssigneeIds.includes(member.id));
    const assignees: TaskAssignee[] = selectedMembers.map((member) => ({
      id: member.id,
      name: member.name,
      email: member.email,
      avatarUrl: member.avatarUrl,
    }));

    persist({
      assignees,
      assignedUserId: assignees[0]?.id,
      users: assignees.map((assignee) => safeAvatarUrl(assignee.name, assignee.avatarUrl) || fallbackAvatarUrl(assignee.name)),
    });
  }

  function toggleAssignee(memberId: string) {
    selectedAssigneeIds = selectedAssigneeIds.includes(memberId)
      ? selectedAssigneeIds.filter((id) => id !== memberId)
      : [...selectedAssigneeIds, memberId];
    syncAssigneesFromSelection();
  }

  function removeAssignee(memberId: string, event?: MouseEvent) {
    event?.stopPropagation();
    selectedAssigneeIds = selectedAssigneeIds.filter((id) => id !== memberId);
    syncAssigneesFromSelection();
  }

  function handleAssigneePickerClick(event: MouseEvent) {
    if (assigneePickerElement && !assigneePickerElement.contains(event.target as Node)) {
      showAssigneePicker = false;
      assigneeSearch = "";
    }
  }

  function runCommand(command: () => boolean) {
    command();
    editor = editor;
    showBlockOptions = false;
    showInsertOptions = false;
    showColorOptions = false;
    showTurnIntoOptions = false;
  }

  function runActiveBlockCommand(command: () => boolean) {
    if (!editor || activeBlockPos === null) return;
    const view = getEditorView();
    if (!view) return;

    const node = editor.state.doc.nodeAt(activeBlockPos);
    if (!node) return;

    const selectionPosition = Math.min(activeBlockPos + 1, editor.state.doc.content.size);
    const selection = TextSelection.near(editor.state.doc.resolve(selectionPosition));
    view.dispatch(editor.state.tr.setSelection(selection));
    runCommand(command);
  }

  async function copyEditorText() {
    if (!editor) return;
    await navigator.clipboard?.writeText(editor.getText());
    showBlockOptions = false;
  }

  async function copyAnchorLink() {
    const anchor = task ? `${window.location.href.split("#")[0]}#task-${task.id}` : window.location.href;
    await navigator.clipboard?.writeText(anchor);
    showBlockOptions = false;
  }

  function duplicateEditorContent() {
    if (!editor || activeBlockPos === null) return;
    const view = getEditorView();
    if (!view) return;

    const node = editor.state.doc.nodeAt(activeBlockPos);
    if (!node) return;

    view.dispatch(editor.state.tr.insert(activeBlockPos + node.nodeSize, node.copy(node.content)));
    view.focus();
    showBlockOptions = false;
  }

  function clearEditorContent() {
    if (!editor || activeBlockPos === null) return;
    const view = getEditorView();
    if (!view) return;

    const node = editor.state.doc.nodeAt(activeBlockPos);
    if (!node) return;

    view.dispatch(editor.state.tr.delete(activeBlockPos, activeBlockPos + node.nodeSize));
    view.focus();
    showBlockOptions = false;
  }

  function findTopLevelBlockAtCoords(event: MouseEvent | DragEvent): BlockTarget | null {
    if (!editor || !editorElement || !editorSectionElement) return null;
    const view = getEditorView();
    if (!view) return null;

    const coords = view.posAtCoords({
      left: editorElement.getBoundingClientRect().left + 8,
      top: event.clientY,
    });

    if (!coords) return null;

    const resolvedPosition = editor.state.doc.resolve(coords.pos);
    if (resolvedPosition.depth === 0) return null;

    const pos = resolvedPosition.before(1);
    const node = resolvedPosition.node(1);
    const dom = view.nodeDOM(pos);

    if (!(dom instanceof HTMLElement)) return null;

    return { pos, node, dom };
  }

  function positionBlockHandle(block: BlockTarget) {
    if (!editorSectionElement) return;

    const sectionRect = editorSectionElement.getBoundingClientRect();
    const blockRect = block.dom.getBoundingClientRect();
    const firstLineOffset = block.node.type.name === "heading" ? 6 : 3;
    blockOptionTop = Math.max(0, blockRect.top - sectionRect.top + firstLineOffset);
    blockMenuLeft = Math.max(8, sectionRect.left - blockMenuWidth - blockMenuGap);
    blockMenuTop = Math.min(
      Math.max(8, blockRect.top + 28),
      Math.max(8, window.innerHeight - estimatedBlockMenuHeight - 8),
    );
    activeBlockPos = block.pos;
    showBlockHandle = true;
  }

  function findVisualBlockAtCoords(event: MouseEvent): BlockTarget | null {
    if (!editor || !editorElement || !editorSectionElement) return null;
    const view = getEditorView();
    if (!view) return null;

    const coords = view.posAtCoords({
      left: editorElement.getBoundingClientRect().left + 8,
      top: event.clientY,
    });

    if (!coords) return null;

    const resolvedPosition = editor.state.doc.resolve(coords.pos);
    let selectedDepth = 0;

    for (let depth = resolvedPosition.depth; depth > 0; depth -= 1) {
      const node = resolvedPosition.node(depth);

      if (node.type.name === "paragraph") {
        const parent = depth > 0 ? resolvedPosition.node(depth - 1) : null;
        if (parent?.type.name === "taskItem" || parent?.type.name === "listItem") continue;
      }

      if (visualBlockTypes.includes(node.type.name)) {
        selectedDepth = depth;
        break;
      }
    }

    if (selectedDepth === 0) return findTopLevelBlockAtCoords(event);

    const pos = resolvedPosition.before(selectedDepth);
    const node = resolvedPosition.node(selectedDepth);
    const dom = view.nodeDOM(pos);

    if (!(dom instanceof HTMLElement)) return findTopLevelBlockAtCoords(event);

    return { pos, node, dom };
  }

  function selectActiveBlock() {
    if (!editor || activeBlockPos === null) return false;
    const view = getEditorView();
    if (!view) return false;

    const selection = NodeSelection.create(editor.state.doc, activeBlockPos);
    view.dispatch(editor.state.tr.setSelection(selection));
    view.focus();
    return true;
  }

  function canMoveBlockTo(pos: number, node: ProseMirrorNode) {
    if (!editor) return false;

    const resolvedPosition = editor.state.doc.resolve(pos);
    const index = resolvedPosition.index();

    return resolvedPosition.parent.canReplaceWith(index, index, node.type, node.marks);
  }

  function findTopLevelBlockByPos(pos: number): DraggedBlock | null {
    if (!editor) return null;

    let target: DraggedBlock | null = null;

    editor.state.doc.forEach((node, offset) => {
      if (offset <= pos && pos < offset + node.nodeSize) {
        target = { pos: offset, node };
      }
    });

    return target;
  }

  function setTextColor(color: string) {
    if (!editor) return;

    if (color) {
      editor.chain().focus().setColor(color).run();
    } else {
      editor.chain().focus().unsetColor().run();
    }

    editor = editor;
    showBlockOptions = false;
    showColorOptions = false;
    showTurnIntoOptions = false;
  }

  function syncBlockOptionsPosition(event: MouseEvent) {
    if (!editorElement || !editorSectionElement) return;
    if (showBlockOptions || showInsertOptions || showTurnIntoOptions) return;

    const editorRect = editorElement.getBoundingClientRect();
    const isInHandleZone = event.clientX >= editorRect.left - 44 && event.clientX <= editorRect.left + 24;

    if (!isInHandleZone) {
      showBlockHandle = false;
      return;
    }

    const block = findVisualBlockAtCoords(event);
    if (!block) return;

    positionBlockHandle(block);
  }

  function hideBlockHandle() {
    if (!showBlockOptions && !showInsertOptions && !showTurnIntoOptions) {
      showBlockHandle = false;
      activeBlockPos = null;
      dropIndicatorTop = null;
      dropTargetPos = null;
    }
  }

  function openBlockOptions() {
    if (!selectActiveBlock()) return;
    showInsertOptions = false;
    showColorOptions = false;
    showTurnIntoOptions = false;
    showBlockOptions = !showBlockOptions;
  }

  function openInsertOptions() {
    if (activeBlockPos === null) return;
    showBlockOptions = false;
    showColorOptions = false;
    showTurnIntoOptions = false;
    showInsertOptions = !showInsertOptions;
  }

  function insertContentAfterActiveBlock(content: string) {
    if (!editor || activeBlockPos === null) return;

    const node = editor.state.doc.nodeAt(activeBlockPos);
    if (!node) return;

    editor.chain().focus().insertContentAt(activeBlockPos + node.nodeSize, content).run();
    showInsertOptions = false;
  }

  function insertParagraph() {
    insertContentAfterActiveBlock("<p></p>");
  }

  function insertHeading() {
    insertContentAfterActiveBlock("<h2>Heading</h2>");
  }

  function insertQuote() {
    insertContentAfterActiveBlock("<blockquote><p>Quote</p></blockquote>");
  }

  function insertCodeBlock() {
    insertContentAfterActiveBlock("<pre><code>Code</code></pre>");
  }

  function insertDivider() {
    if (!editor || activeBlockPos === null) return;

    const node = editor.state.doc.nodeAt(activeBlockPos);
    if (!node) return;

    editor.chain().focus().setTextSelection(activeBlockPos + node.nodeSize).setHorizontalRule().run();
    showInsertOptions = false;
  }

  function insertBulletList() {
    insertContentAfterActiveBlock("<ul><li>List item</li></ul>");
  }

  function insertOrderedList() {
    insertContentAfterActiveBlock("<ol><li>List item</li></ol>");
  }

  function insertTaskList() {
    insertContentAfterActiveBlock(
      '<ul data-type="taskList"><li data-type="taskItem" data-checked="false"><label><input type="checkbox"><span></span></label><div><p>Task item</p></div></li></ul>',
    );
  }

  function turnIntoParagraph() {
    runActiveBlockCommand(() => editor?.chain().focus().setParagraph().run() ?? false);
  }

  function turnIntoHeading(level: 1 | 2 | 3) {
    runActiveBlockCommand(() => editor?.chain().focus().setNode("heading", { level }).run() ?? false);
  }

  function turnIntoQuote() {
    runActiveBlockCommand(() => editor?.chain().focus().toggleBlockquote().run() ?? false);
  }

  function turnIntoBulletList() {
    runActiveBlockCommand(() => editor?.chain().focus().toggleBulletList().run() ?? false);
  }

  function turnIntoOrderedList() {
    runActiveBlockCommand(() => editor?.chain().focus().toggleOrderedList().run() ?? false);
  }

  function turnIntoTaskList() {
    runActiveBlockCommand(() => editor?.chain().focus().toggleTaskList().run() ?? false);
  }

  function turnIntoCodeBlock() {
    runActiveBlockCommand(() => editor?.chain().focus().toggleCodeBlock().run() ?? false);
  }

  function resetActiveBlockFormatting() {
    runActiveBlockCommand(
      () =>
        editor
          ?.chain()
          .focus()
          .clearNodes()
          .unsetAllMarks()
          .run() ?? false,
    );
  }

  function openTurnIntoOptions(event: MouseEvent) {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const maxTop = Math.max(8, window.innerHeight - estimatedTurnIntoMenuHeight - 8);

    showColorOptions = false;
    turnIntoMenuTop = Math.min(Math.max(8, rect.top), maxTop);
    showTurnIntoOptions = true;
  }

  function toggleTurnIntoOptions(event: MouseEvent) {
    if (showTurnIntoOptions) {
      showTurnIntoOptions = false;
      return;
    }

    openTurnIntoOptions(event);
  }

  function handleBlockDragStart(event: DragEvent) {
    if (!editor || activeBlockPos === null) return;

    const block = findTopLevelBlockByPos(activeBlockPos);
    if (!block) return;

    draggedBlock = block;
    showBlockOptions = false;
    event.dataTransfer?.setData("application/x-bloom-task-block", String(block.pos));
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = "move";
    }
  }

  function ownBlockDragEvent(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = "move";
    }
  }

  function handleBlockDragOver(event: DragEvent) {
    if (!draggedBlock || !editorElement || !editorSectionElement) return;

    ownBlockDragEvent(event);
    const block = findTopLevelBlockAtCoords(event);
    if (!block || block.pos === draggedBlock.pos) {
      activeBlockPos = null;
      dropIndicatorTop = null;
      dropTargetPos = null;
      return;
    }

    const sectionRect = editorSectionElement.getBoundingClientRect();
    const editorRect = editorElement.getBoundingClientRect();
    const blockRect = block.dom.getBoundingClientRect();
    const insertAfter = event.clientY > blockRect.top + blockRect.height / 2;

    dropTargetPos = insertAfter ? block.pos + block.node.nodeSize : block.pos;
    dropIndicatorLeft = Math.max(0, editorRect.left - sectionRect.left);
    dropIndicatorTop = Math.max(
      0,
      (insertAfter ? blockRect.bottom : blockRect.top) - sectionRect.top - 1,
    );
    dropIndicatorWidth = Math.max(120, editorRect.width);
    activeBlockPos = block.pos;
  }

  function handleBlockDrop(event: DragEvent) {
    if (!editor || !draggedBlock) return;
    const view = getEditorView();
    if (!view) return;

    ownBlockDragEvent(event);
    if (dropTargetPos === null) {
      draggedBlock = null;
      dropIndicatorTop = null;
      return;
    }

    const sourceStart = draggedBlock.pos;
    const sourceEnd = sourceStart + draggedBlock.node.nodeSize;
    let targetPos = dropTargetPos;

    if (!canMoveBlockTo(targetPos, draggedBlock.node)) {
      draggedBlock = null;
      dropIndicatorTop = null;
      dropTargetPos = null;
      return;
    }

    if (targetPos >= sourceStart && targetPos <= sourceEnd) {
      draggedBlock = null;
      dropIndicatorTop = null;
      dropTargetPos = null;
      return;
    }

    if (sourceStart < targetPos) {
      targetPos -= draggedBlock.node.nodeSize;
    }

    const transaction = editor.state.tr
      .delete(sourceStart, sourceEnd)
      .insert(targetPos, draggedBlock.node);

    transaction.setSelection(NodeSelection.create(transaction.doc, targetPos));

    view.dispatch(transaction);
    view.focus();
    draggedBlock = null;
    dropIndicatorTop = null;
    dropTargetPos = null;
    showBlockHandle = false;
  }

  function handleBlockDragEnd() {
    draggedBlock = null;
    dropIndicatorTop = null;
    dropTargetPos = null;
  }

  async function initializeEditor() {
    if (editor || !task) return;

    await tick();
    if (editor || !task || !editorElement) return;

    editor = new Editor({
      element: editorElement,
      extensions: [
        StarterKit.configure({
          dropcursor: false,
          heading: {
            levels: [1, 2, 3],
          },
        }),
        Underline,
        TextStyle,
        Color,
        TaskList,
        TaskItem.configure({
          nested: true,
        }),
        Placeholder.configure({
          placeholder: "Write task notes, decisions, blockers, and checklist items...",
        }),
      ],
      content: task?.content ?? "",
      editorProps: {
        attributes: {
          class:
            "task-editor-content min-h-[340px] focus:outline-none text-gray-800",
        },
        handleDOMEvents: {
          dragover: (_view, event) => {
            if (!draggedBlock) return false;
            handleBlockDragOver(event);
            return true;
          },
          drop: (_view, event) => {
            if (!draggedBlock) return false;
            handleBlockDrop(event);
            return true;
          },
        },
      },
      onUpdate: ({ editor: currentEditor }) => {
        if (!task) return;
        updateTask(task.id, {
          content: currentEditor.getHTML(),
          contentJson: currentEditor.getJSON(),
          contentText: currentEditor.getText(),
        });
      },
      onSelectionUpdate: () => {
        editor = editor;
      },
    });

    lastTaskId = task?.id ?? null;
  }

  onMount(() => {
    isMounted = true;
    document.addEventListener("mousedown", handleAssigneePickerClick);
    void initializeEditor();
  });

  onDestroy(() => {
    isMounted = false;
    document.removeEventListener("mousedown", handleAssigneePickerClick);
    editor?.destroy();
  });
</script>

<aside class="flex h-full min-h-0 w-full flex-col border-l border-gray-100 bg-white">
  {#if task}
    <div class="flex items-center justify-between border-b border-gray-100 px-5 py-4">
      <div class="min-w-0">
        {#if task.project}
          <p class="text-xs font-semibold uppercase tracking-wide text-gray-400">{task.project}</p>
        {/if}
        <h2 class="truncate text-base font-bold text-gray-900">Task Detail</h2>
      </div>
      <button
        class="rounded-lg p-2 text-gray-400 transition hover:bg-gray-50 hover:text-gray-700"
        aria-label="Close task detail"
        title="Close"
        on:click={() => dispatch("close")}
      >
        <PanelRightClose class="h-5 w-5" />
      </button>
    </div>

    <div class="flex-1 overflow-y-auto overflow-x-visible px-6 py-6">
      <input
        class="w-full border-none bg-transparent text-4xl font-bold leading-tight text-gray-950 outline-none placeholder:text-gray-300"
        value={task.title}
        aria-label="Task title"
        on:input={(event) => persist({ title: event.currentTarget.value })}
      />

      <input
        class="mt-3 w-full border-none bg-transparent text-base leading-7 text-gray-500 outline-none placeholder:text-gray-300"
        value={task.description}
        aria-label="Task description"
        placeholder="Add a short description..."
        on:input={(event) => persist({ description: event.currentTarget.value })}
      />

      <div class="mt-6 grid gap-2 border-y border-gray-100 py-4 text-sm">
        <div class="grid grid-cols-[96px_minmax(0,1fr)] items-center gap-3">
          <span class="text-gray-400">Category</span>
          <select
            class="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
            value={task.category}
            on:change={(event) => persist({ category: event.currentTarget.value as TaskCategory })}
          >
            {#each taskCategories as category}
              <option value={category.name}>{category.name}</option>
            {/each}
          </select>
        </div>

        <div class="grid grid-cols-[96px_minmax(0,1fr)] items-center gap-3">
          <span class="text-gray-400">Status</span>
          <select
            class="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
            value={task.status}
            on:change={(event) => persist({ status: event.currentTarget.value as TaskStatus })}
          >
            {#each statuses as status}
              <option value={status}>{status}</option>
            {/each}
          </select>
        </div>

        <div class="grid grid-cols-[96px_minmax(0,1fr)] items-center gap-3">
          <span class="text-gray-400">Priority</span>
          <select
            class="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
            value={task.priority}
            on:change={(event) => persist({ priority: event.currentTarget.value as TaskPriority })}
          >
            {#each priorities as priority}
              <option value={priority}>{priority}</option>
            {/each}
          </select>
        </div>

        <div class="grid grid-cols-[96px_minmax(0,1fr)] items-center gap-3">
          <span class="text-gray-400">Owner</span>
          <select
            class="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
            value={task.ownerId ?? ""}
            on:change={(event) => updateOwner(event.currentTarget.value)}
          >
            <option value="">Unassigned</option>
            {#each memberOptions as member}
              <option value={member.id}>{member.name}</option>
            {/each}
          </select>
        </div>

        <div class="grid grid-cols-[96px_minmax(0,1fr)] items-start gap-3">
          <span class="pt-2 text-gray-400">Assigned to</span>
          <div class="relative" bind:this={assigneePickerElement}>
            <div
              role="button"
              tabindex="0"
              class={cn(
                "flex min-h-10 w-full items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-left text-sm text-gray-700 outline-none transition hover:border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-100",
                showAssigneePicker && "border-pink-500 ring-2 ring-pink-100"
              )}
              aria-haspopup="listbox"
              aria-expanded={showAssigneePicker}
              on:click={() => (showAssigneePicker = !showAssigneePicker)}
              on:keydown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  showAssigneePicker = !showAssigneePicker;
                }
              }}
            >
              <span class="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
                {#if selectedAssignees.length > 0}
                  {#each selectedAssignees.slice(0, 3) as assignee}
                    <span class="flex max-w-full items-center gap-1 rounded-md bg-gray-100 py-1 pl-1 pr-1.5 text-xs font-medium text-gray-700">
                      <img class="h-5 w-5 rounded-full object-cover" src={assignee.avatarUrl} alt="" />
                      <span class="max-w-24 truncate">{assignee.name}</span>
                      <button
                        type="button"
                        class="rounded p-0.5 text-gray-400 transition hover:bg-white hover:text-gray-700"
                        aria-label={`Remove ${assignee.name}`}
                        on:click={(event) => removeAssignee(assignee.id, event)}
                        on:keydown={(event) => {
                          event.stopPropagation();
                        }}
                      >
                        <X size={12} />
                      </button>
                    </span>
                  {/each}
                  {#if selectedAssignees.length > 3}
                    <span class="rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-500">+{selectedAssignees.length - 3}</span>
                  {/if}
                {:else}
                  <span class="flex items-center gap-2 px-1 text-gray-400">
                    <UserPlus size={16} />
                    Add people
                  </span>
                {/if}
              </span>
              <ChevronDown size={16} class="shrink-0 text-gray-400" />
            </div>

            {#if showAssigneePicker}
              <div class="absolute z-30 mt-2 w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
                <div class="flex items-center gap-2 border-b border-gray-100 px-3 py-2">
                  <Search size={15} class="text-gray-400" />
                  <input
                    class="h-8 min-w-0 flex-1 bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400"
                    placeholder="Search people"
                    bind:value={assigneeSearch}
                  />
                </div>

                <div class="max-h-64 overflow-y-auto p-1" role="listbox" aria-label="Assigned to">
                  {#if filteredAssigneeOptions.length > 0}
                    {#each filteredAssigneeOptions as member}
                      {@const isSelected = selectedAssigneeIds.includes(member.id)}
                      <button
                        type="button"
                        class={cn(
                          "flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition hover:bg-gray-50",
                          isSelected && "bg-pink-50"
                        )}
                        aria-selected={isSelected}
                        role="option"
                        on:click={() => toggleAssignee(member.id)}
                      >
                        <img class="h-8 w-8 rounded-full object-cover" src={member.avatarUrl} alt="" />
                        <span class="min-w-0 flex-1">
                          <span class="block truncate text-sm font-medium text-gray-800">{member.name}</span>
                          <span class="block truncate text-xs text-gray-400">{member.email}</span>
                        </span>
                        {#if isSelected}
                          <span class="h-2.5 w-2.5 rounded-full bg-pink-500" aria-hidden="true"></span>
                        {/if}
                      </button>
                    {/each}
                  {:else}
                    <div class="px-3 py-5 text-center text-sm text-gray-400">No people found</div>
                  {/if}
                </div>
              </div>
            {/if}
          </div>
        </div>

        <div class="grid grid-cols-[96px_minmax(0,1fr)] items-center gap-3">
          <span class="text-gray-400">Due date</span>
          <input
            type="date"
            class="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
            value={task.dueDate === "No date" ? "" : task.dueDate}
            on:input={(event) => persist({ dueDate: event.currentTarget.value })}
          />
        </div>
      </div>

      <div
        class="relative mt-8 pl-11"
        role="presentation"
        bind:this={editorSectionElement}
        on:mousemove={syncBlockOptionsPosition}
        on:mouseleave={hideBlockHandle}
        on:dragover={handleBlockDragOver}
        on:drop={handleBlockDrop}
      >
        <div
          class="absolute left-0 top-0 hidden h-full w-10 sm:block"
          aria-hidden="true"
          on:mousemove={syncBlockOptionsPosition}
        ></div>

        {#if showBlockHandle || showBlockOptions || showInsertOptions || showTurnIntoOptions}
          <div class="absolute left-0 z-20 hidden h-6 items-center gap-0.5 sm:flex" style={`top: ${blockOptionTop}px`}>
            <button
              class="flex h-5 w-5 items-center justify-center rounded-md text-gray-300 transition hover:bg-gray-50 hover:text-gray-600"
              aria-label="Add block"
              title="Add block"
              on:click={openInsertOptions}
            >
              <Plus class="h-4 w-4" />
            </button>

            <button
              class="flex h-5 w-5 cursor-grab items-center justify-center rounded-md text-gray-300 transition hover:bg-gray-50 hover:text-gray-600 active:cursor-grabbing"
              aria-label="Open block options"
              title="Drag to move, click for options"
              draggable="true"
              on:click={openBlockOptions}
              on:dragstart={handleBlockDragStart}
              on:dragend={handleBlockDragEnd}
            >
              <GripVertical class="h-4 w-4" />
            </button>
          </div>
        {/if}

        {#if dropIndicatorTop !== null}
          <div
            class="pointer-events-none absolute z-10 h-0.5 rounded-full bg-pink-500"
            style={`left: ${dropIndicatorLeft}px; top: ${dropIndicatorTop}px; width: ${dropIndicatorWidth}px`}
          ></div>
        {/if}

        {#if showInsertOptions}
          <div
            class="fixed z-50 w-56 rounded-xl border border-gray-200 bg-white p-2 text-sm shadow-2xl"
            role="presentation"
            style={`left: ${blockMenuLeft}px; top: ${blockMenuTop}px`}
            on:mousemove={(event) => event.stopPropagation()}
            on:mousedown={(event) => event.stopPropagation()}
            on:click={(event) => event.stopPropagation()}
          >
            <div class="px-2 py-2 text-xs font-semibold text-gray-500">Add block</div>
            <button class="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-gray-600 transition hover:bg-gray-50" on:click={insertParagraph}>
              <Type class="h-4 w-4" />
              Text
            </button>
            <button class="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-gray-600 transition hover:bg-gray-50" on:click={insertHeading}>
              <Type class="h-4 w-4" />
              Heading
            </button>
            <button class="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-gray-600 transition hover:bg-gray-50" on:click={insertQuote}>
              <Type class="h-4 w-4" />
              Quote
            </button>
            <button class="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-gray-600 transition hover:bg-gray-50" on:click={insertBulletList}>
              <Type class="h-4 w-4" />
              Bulleted list
            </button>
            <button class="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-gray-600 transition hover:bg-gray-50" on:click={insertOrderedList}>
              <Type class="h-4 w-4" />
              Numbered list
            </button>
            <button class="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-gray-600 transition hover:bg-gray-50" on:click={insertTaskList}>
              <Type class="h-4 w-4" />
              Todo
            </button>
            <button class="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-gray-600 transition hover:bg-gray-50" on:click={insertCodeBlock}>
              <Type class="h-4 w-4" />
              Code block
            </button>
            <button class="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-gray-600 transition hover:bg-gray-50" on:click={insertDivider}>
              <Type class="h-4 w-4" />
              Divider
            </button>
          </div>
        {/if}

        {#if showBlockOptions}
          <div
            class="fixed z-50 w-64 rounded-2xl border border-gray-200 bg-white p-2 text-sm shadow-2xl"
            role="presentation"
            style={`left: ${blockMenuLeft}px; top: ${blockMenuTop}px`}
            on:mousemove={(event) => event.stopPropagation()}
            on:mousedown={(event) => event.stopPropagation()}
            on:click={(event) => event.stopPropagation()}
          >
            <div class="px-2 py-2 text-xs font-semibold text-gray-500" role="presentation" on:mouseenter={() => (showTurnIntoOptions = false)}>Text</div>

            <div class="mb-1 grid grid-cols-3 gap-1 px-2" role="presentation" on:mouseenter={() => (showTurnIntoOptions = false)}>
              <button
                class={cn("rounded-md border border-gray-100 px-2 py-1.5 text-xs text-gray-600 hover:bg-gray-50", editor?.isActive("bold") ? "bg-gray-100 text-pink-600" : "")}
                on:click={() => editor && runCommand(() => editor!.chain().focus().toggleBold().run())}
              >
                <Bold class="mx-auto h-4 w-4" />
              </button>
              <button
                class={cn("rounded-md border border-gray-100 px-2 py-1.5 text-xs text-gray-600 hover:bg-gray-50", editor?.isActive("italic") ? "bg-gray-100 text-pink-600" : "")}
                on:click={() => editor && runCommand(() => editor!.chain().focus().toggleItalic().run())}
              >
                <Italic class="mx-auto h-4 w-4" />
              </button>
              <button
                class={cn("rounded-md border border-gray-100 px-2 py-1.5 text-xs text-gray-600 hover:bg-gray-50", editor?.isActive("underline") ? "bg-gray-100 text-pink-600" : "")}
                on:click={() => editor && runCommand(() => editor!.chain().focus().toggleUnderline().run())}
              >
                <UnderlineIcon class="mx-auto h-4 w-4" />
              </button>
            </div>

            <button
              class="flex w-full items-center justify-between rounded-lg px-2 py-2 text-gray-600 transition hover:bg-gray-50"
              on:mouseenter={() => (showTurnIntoOptions = false)}
              on:click={() => (showColorOptions = !showColorOptions)}
            >
              <span class="flex items-center gap-2">
                <Palette class="h-4 w-4" />
                Color
              </span>
              <span class="text-gray-300">></span>
            </button>

            {#if showColorOptions}
              <div class="grid grid-cols-2 gap-1 px-2 pb-2">
                {#each colorOptions as color}
                  <button
                    class="flex items-center gap-2 rounded-md border border-gray-100 px-2 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
                    on:click={() => setTextColor(color.value)}
                  >
                    <span class="h-3 w-3 rounded-full border border-gray-200" style={`background: ${color.value || "#111827"}`}></span>
                    {color.label}
                  </button>
                {/each}
              </div>
            {/if}

            <button
              class={cn(
                "flex w-full items-center justify-between rounded-lg px-2 py-2 text-gray-600 transition hover:bg-gray-50",
                showTurnIntoOptions ? "bg-gray-50 text-gray-900" : "",
              )}
              on:mouseenter={openTurnIntoOptions}
              on:click={toggleTurnIntoOptions}
            >
              <span class="flex items-center gap-2">
                <Type class="h-4 w-4" />
                Turn Into
              </span>
              <span class="text-gray-300">></span>
            </button>

            <button class="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-gray-600 transition hover:bg-gray-50" on:mouseenter={() => (showTurnIntoOptions = false)} on:click={resetActiveBlockFormatting}>
              <RotateCcw class="h-4 w-4" />
              Reset formatting
            </button>

            {#if showTurnIntoOptions}
              <div
                class="fixed z-[60] w-56 rounded-2xl border border-gray-200 bg-white p-2 text-sm shadow-2xl"
                role="presentation"
                style={`left: ${blockMenuLeft + blockMenuWidth + 8}px; top: ${turnIntoMenuTop}px`}
                on:mousemove={(event) => event.stopPropagation()}
                on:mousedown={(event) => event.stopPropagation()}
                on:click={(event) => event.stopPropagation()}
              >
                <div class="px-2 py-2 text-xs font-semibold text-gray-500">Turn into</div>
                <button class="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-gray-600 transition hover:bg-gray-50" on:click={turnIntoParagraph}>
                  <Type class="h-4 w-4" />
                  Text
                </button>
                <button class="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-gray-600 transition hover:bg-gray-50" on:click={() => turnIntoHeading(1)}>
                  <Heading1 class="h-4 w-4" />
                  Heading 1
                </button>
                <button class="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-gray-600 transition hover:bg-gray-50" on:click={() => turnIntoHeading(2)}>
                  <Heading2 class="h-4 w-4" />
                  Heading 2
                </button>
                <button class="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-gray-600 transition hover:bg-gray-50" on:click={() => turnIntoHeading(3)}>
                  <Heading3 class="h-4 w-4" />
                  Heading 3
                </button>
                <button class="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-gray-600 transition hover:bg-gray-50" on:click={turnIntoBulletList}>
                  <List class="h-4 w-4" />
                  Bullet List
                </button>
                <button class="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-gray-600 transition hover:bg-gray-50" on:click={turnIntoOrderedList}>
                  <ListOrdered class="h-4 w-4" />
                  Ordered List
                </button>
                <button class="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-gray-600 transition hover:bg-gray-50" on:click={turnIntoTaskList}>
                  <ListChecks class="h-4 w-4" />
                  Task List
                </button>
                <button class="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-gray-600 transition hover:bg-gray-50" on:click={turnIntoQuote}>
                  <Quote class="h-4 w-4" />
                  Blockquote
                </button>
                <button class="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-gray-600 transition hover:bg-gray-50" on:click={turnIntoCodeBlock}>
                  <Code2 class="h-4 w-4" />
                  Code Block
                </button>
              </div>
            {/if}

            <div class="my-1 h-px bg-gray-100"></div>

            <button class="flex w-full items-center justify-between rounded-lg px-2 py-2 text-gray-600 transition hover:bg-gray-50" on:mouseenter={() => (showTurnIntoOptions = false)} on:click={duplicateEditorContent}>
              <span class="flex items-center gap-2">
                <Copy class="h-4 w-4" />
                Duplicate node
              </span>
              <span class="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500">ModD</span>
            </button>
            <button class="flex w-full items-center justify-between rounded-lg px-2 py-2 text-gray-600 transition hover:bg-gray-50" on:mouseenter={() => (showTurnIntoOptions = false)} on:click={copyEditorText}>
              <span class="flex items-center gap-2">
                <Clipboard class="h-4 w-4" />
                Copy to clipboard
              </span>
              <span class="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500">ModC</span>
            </button>
            <button class="flex w-full items-center justify-between rounded-lg px-2 py-2 text-gray-600 transition hover:bg-gray-50" on:mouseenter={() => (showTurnIntoOptions = false)} on:click={copyAnchorLink}>
              <span class="flex items-center gap-2">
                <Link class="h-4 w-4" />
                Copy anchor link
              </span>
              <span class="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500">ModCtrlL</span>
            </button>

            <div class="my-1 h-px bg-gray-100"></div>

            <button class="flex w-full cursor-not-allowed items-center justify-between rounded-lg px-2 py-2 text-gray-400" on:mouseenter={() => (showTurnIntoOptions = false)} disabled>
              <span class="flex items-center gap-2">
                <Sparkles class="h-4 w-4" />
                Ask AI
              </span>
              <span class="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-400">ModJ</span>
            </button>

            <div class="my-1 h-px bg-gray-100"></div>

            <button class="flex w-full items-center justify-between rounded-lg px-2 py-2 text-red-600 transition hover:bg-red-50" on:mouseenter={() => (showTurnIntoOptions = false)} on:click={clearEditorContent}>
              <span class="flex items-center gap-2">
                <Trash2 class="h-4 w-4" />
                Delete
              </span>
              <span class="rounded bg-red-50 px-1.5 py-0.5 text-[10px] text-red-500">Backspace</span>
            </button>
          </div>
        {/if}

        <div class="notion-document rounded-xl px-1 py-2" bind:this={editorElement}></div>
      </div>
    </div>
  {:else}
    <div class="flex h-full flex-col items-center justify-center px-8 text-center">
      <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-50 text-gray-400">
        <PanelRightClose class="h-5 w-5" />
      </div>
      <h2 class="mt-4 text-base font-bold text-gray-900">No task selected</h2>
      <p class="mt-2 text-sm leading-6 text-gray-500">Select a task to open the editor.</p>
    </div>
  {/if}
</aside>

<style>
  :global(.task-editor-content h1) {
    font-size: 1.875rem;
    line-height: 2.25rem;
    font-weight: 750;
    margin: 1rem 0 0.5rem;
  }

  :global(.task-editor-content h2) {
    font-size: 1.25rem;
    line-height: 1.75rem;
    font-weight: 700;
    margin: 1rem 0 0.5rem;
  }

  :global(.task-editor-content p) {
    margin: 0.45rem 0;
    line-height: 1.7;
  }

  :global(.task-editor-content blockquote) {
    border-left: 3px solid #d1d5db;
    color: #4b5563;
    margin: 0.85rem 0;
    padding-left: 1rem;
  }

  :global(.task-editor-content blockquote p) {
    margin: 0.35rem 0;
  }

  :global(.task-editor-content ul:not([data-type="taskList"])) {
    list-style: disc;
    padding-left: 1.4rem;
    margin: 0.5rem 0;
  }

  :global(.task-editor-content ol) {
    list-style: decimal;
    padding-left: 1.4rem;
    margin: 0.5rem 0;
  }

  :global(.task-editor-content ul[data-type="taskList"]) {
    list-style: none;
    padding-left: 0;
    margin: 0.6rem 0;
  }

  :global(.task-editor-content li[data-type="taskItem"]) {
    display: flex !important;
    flex-direction: row;
    gap: 0.6rem !important;
    align-items: flex-start;
    margin: 0.45rem 0;
    padding: 0 !important;
  }

  :global(.task-editor-content li[data-type="taskItem"] label) {
    display: flex !important;
    flex: 0 0 1rem;
    height: 1.7rem;
    align-items: flex-start;
    justify-content: center;
    margin: 0 !important;
    padding: 0.43rem 0 0 !important;
    line-height: 1;
  }

  :global(.task-editor-content li[data-type="taskItem"] input[type="checkbox"]) {
    position: static !important;
    display: block !important;
    margin: 0 !important;
    height: 0.875rem;
    width: 0.875rem;
    flex: none;
    transform: none !important;
  }

  :global(.task-editor-content li[data-type="taskItem"] label span) {
    display: none;
  }

  :global(.task-editor-content li[data-type="taskItem"] > div) {
    flex: 1 1 auto;
    min-width: 0;
    padding: 0 !important;
  }

  :global(.task-editor-content li[data-type="taskItem"] > div > p:first-child) {
    margin-top: 0;
  }

  :global(.task-editor-content li[data-type="taskItem"] > div > p:last-child) {
    margin-bottom: 0;
  }

  :global(.task-editor-content ul[data-type="taskList"] > li) {
    display: flex !important;
    flex-direction: row !important;
    gap: 0.6rem !important;
    align-items: flex-start !important;
    margin: 0.45rem 0 !important;
    padding: 0 !important;
  }

  :global(.task-editor-content ul[data-type="taskList"] > li > label) {
    display: flex !important;
    flex: 0 0 1rem !important;
    height: 1.7rem !important;
    align-items: flex-start !important;
    justify-content: center !important;
    margin: 0 !important;
    padding: 0.38rem 0 0 !important;
    line-height: 1 !important;
  }

  :global(.task-editor-content ul[data-type="taskList"] > li > label > input[type="checkbox"]) {
    position: static !important;
    display: block !important;
    width: 0.875rem !important;
    height: 0.875rem !important;
    margin: 0 !important;
    flex: none !important;
    transform: none !important;
  }

  :global(.task-editor-content ul[data-type="taskList"] > li > label > span) {
    display: none !important;
  }

  :global(.task-editor-content ul[data-type="taskList"] > li > div) {
    flex: 1 1 auto !important;
    min-width: 0 !important;
    padding: 0 !important;
  }

  :global(.task-editor-content ul[data-type="taskList"] > li > div > p:first-child) {
    margin-top: 0 !important;
  }

  :global(.task-editor-content ul[data-type="taskList"] > li > div > p:last-child) {
    margin-bottom: 0 !important;
  }

  :global(.task-editor-content .is-editor-empty:first-child::before) {
    color: #9ca3af;
    content: attr(data-placeholder);
    float: left;
    height: 0;
    pointer-events: none;
  }
</style>

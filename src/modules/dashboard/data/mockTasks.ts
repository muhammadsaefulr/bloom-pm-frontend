import type { Task } from '../types/dashboard.types';
import type { SuggestedTask } from './mockUser';

export const mockSuggestedTasks: SuggestedTask[] = [
    { id: 'st1', title: 'Conduct UX Research' },
    { id: 'st2', title: 'Write a prospect email' }
];

export const mockMyTasks: Task[] = [
    { id: 't1', title: 'Design Meeting', time: '2 pm', isMeeting: true, collaborators: ['https://avatars.githubusercontent.com/u/3?v=4'] },
    { id: 't2', title: 'Refine UI components based on user feedback', status: 'Urgent', tags: ['By today'] },
    { id: 't3', title: 'Prepare a prototype for usability testing', status: 'In progress', tags: ['By tomorrow'] },
    { id: 't4', title: 'Collaborate with developers on implementation detail', status: 'To do', tags: ['By tomorrow'] },
];

import type { Task, FileItem, MeetingSummary } from '../types/dashboard.types';

export interface User {
    name: string;
    greeting: string;
    subGreeting: string;
}

export interface SuggestedTask {
    id: string;
    title: string;
}

export const mockUser: User = {
    name: 'Sam',
    greeting: 'Welcome, Sam! 👋',
    subGreeting: 'How can I help you today?'
};

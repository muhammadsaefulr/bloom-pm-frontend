export interface Task {
    id: string;
    title: string;
    time?: string;
    status?: 'Urgent' | 'By today' | 'In progress' | 'By tomorrow' | 'To do';
    tags?: string[];
    isMeeting?: boolean;
    meetingTime?: string;
    collaborators?: string[];
}

export interface FileItem {
    id: string;
    type: 'doc' | 'sheet' | 'slide' | 'pdf' | 'figma' | 'miro';
    title: string;
    url: string;
}

export interface MeetingSummary {
    id: string;
    title: string;
    date: string;
    avatar: string;
    type: string;
}

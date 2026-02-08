import { mockUser, mockRecentFiles, mockLastMeeting, mockSuggestedTasks, mockMyTasks } from '../data';

export const getDashboardData = () => {
    return {
        user: mockUser,
        recentFiles: mockRecentFiles,
        lastMeeting: mockLastMeeting,
        suggestedTasks: mockSuggestedTasks,
        myTasks: mockMyTasks
    };
};

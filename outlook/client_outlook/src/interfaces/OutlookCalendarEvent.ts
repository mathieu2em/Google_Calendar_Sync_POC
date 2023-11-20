/* eslint-disable @typescript-eslint/no-explicit-any */
export interface OutlookCalendarEvent {
        id: string;
        createdDateTime: string;
        lastModifiedDateTime: string;
        changeKey: string;
        categories: string[];
        transactionId?: string;
        originalStartTimeZone: string;
        originalEndTimeZone: string;
        iCalUId: string;
        reminderMinutesBeforeStart: number;
        isReminderOn: boolean;
        hasAttachments: boolean;
        subject: string;
        bodyPreview: string;
        importance: string;
        sensitivity: string;
        isAllDay: boolean;
        isCancelled: boolean;
        isOrganizer: boolean;
        responseRequested: boolean;
        seriesMasterId?: string;
        showAs: string;
        type: string;
        webLink: string;
        onlineMeetingUrl?: string;
        isOnlineMeeting: boolean;
        onlineMeetingProvider: string;
        allowNewTimeProposals: boolean;
        occurrenceId?: string;
        isDraft: boolean;
        hideAttendees: boolean;
        responseStatus: {
            response: string;
            time: string;
        };
        body: {
            contentType: string;
            content: string;
        };
        start: {
            dateTime: string;
            timeZone: string;
        };
        end: {
            dateTime: string;
            timeZone: string;
        };
        location: {
            displayName: string;
            locationType: string;
            uniqueIdType: string;
            address: Record<string, unknown>;
            coordinates: Record<string, unknown>;
        };
        locations: any[];
        recurrence?: {
            pattern: {
                type: string;
                interval: number;
                month: number;
                dayOfMonth: number;
                daysOfWeek: string[];
                firstDayOfWeek: string;
                index: string;
            };
            range: {
                type: string;
                startDate: string;
                endDate: string;
                recurrenceTimeZone: string;
                numberOfOccurrences: number;
            };
        };
        attendees: any[];
        organizer: {
            emailAddress: {
                name: string;
                address: string;
            };
        };
        onlineMeeting?: any;
        // Add other properties as needed
}
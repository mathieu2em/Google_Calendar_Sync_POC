export interface RecurrencePattern {
    type: string;
    interval: number;
    month?: number;
    dayOfMonth?: number;
    daysOfWeek?: string[];
    firstDayOfWeek?: string;
    index?: string;
}

export interface RecurrenceRange {
    type: string;
    startDate: string;
    endDate?: string;
    recurrenceTimeZone?: string;
    numberOfOccurrences?: number;
}
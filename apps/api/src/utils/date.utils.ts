
/**
 * Calculates the target expiry date based on a day name (e.g., "TUESDAY") and a weekly offset.
 * 
 * @param expiryDay - The day of the week (e.g., "MONDAY", "TUESDAY"). Case insensitive.
 * @param offset - The number of weeks to add. 0 means the next occurrence (or today). 1 means +1 week.
 * @returns A Date object set to 00:00:00.000 UTC for the calculated date.
 */
export function calculateTargetExpiry(expiryDay: string, offset: number = 0): Date {
    const dayMap: Record<string, number> = {
        'SUNDAY': 0, 'MONDAY': 1, 'TUESDAY': 2, 'WEDNESDAY': 3, 'THURSDAY': 4, 'FRIDAY': 5, 'SATURDAY': 6
    };
    
    const targetDayIndex = dayMap[expiryDay.toUpperCase()];
    if (targetDayIndex === undefined) {
        throw new Error(`Invalid expiry_day: ${expiryDay}`);
    }

    const today = new Date();
    const currentDayIndex = today.getDay(); // 0 (Sun) - 6 (Sat) (Local time)

    // Calculate days to add to reach the next target day (or today if it matches)
    let daysToAdd = targetDayIndex - currentDayIndex;
    if (daysToAdd < 0) {
        daysToAdd += 7; // It's in the next week
    }

    // Adjust for Offset (assuming offset 0 = nearest occurrence, offset 1 = +1 week)
    daysToAdd += offset * 7;

    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + daysToAdd);
    
    // Set to Midnight UTC
    const y = targetDate.getFullYear();
    const m = targetDate.getMonth();
    const d = targetDate.getDate();
    
    return new Date(Date.UTC(y, m, d, 0, 0, 0, 0));
}

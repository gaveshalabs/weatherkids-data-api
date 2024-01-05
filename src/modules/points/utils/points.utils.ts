export class PointsUtils {
  static extractDayFromTimestamp(timestamp: number) {
    const date = new Date(timestamp);
    date.setHours(0, 0, 0, 0); // Reset hours, minutes, seconds, and milliseconds
    return date.getTime(); // Return the start of the day in milliseconds
  }

  static extractHourFromTimestamp(timestamp: number) {
    const date = new Date(timestamp);
    date.setMinutes(0, 0, 0); // Reset minutes, seconds, and milliseconds
    return date.getTime(); // Return the time in milliseconds
  }
}

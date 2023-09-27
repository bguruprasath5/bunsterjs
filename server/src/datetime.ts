export class BunsterDateTime {
  // Return current date and time as string in format: 'YYYY-MM-DD HH:mm:ss'
  static now(): string {
    return new Date().toISOString().slice(0, 19).replace("T", " ");
  }

  // Create a Date object from ticks (milliseconds since epoch)
  static getDateFromTicks(ticks: number): Date {
    return new Date(ticks);
  }

  // Add days to a Date object
  static addDays(date: Date, days: number): Date {
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() + days);
    return newDate;
  }

  // Subtract days from a Date object
  static subtractDays(date: Date, days: number): Date {
    return this.addDays(date, -days);
  }

  // Add hours to a Date object
  static addHours(date: Date, hours: number): Date {
    const newDate = new Date(date);
    newDate.setHours(newDate.getHours() + hours);
    return newDate;
  }

  // Subtract hours from a Date object
  static subtractHours(date: Date, hours: number): Date {
    return this.addHours(date, -hours);
  }

  // Add minutes to a Date object
  static addMinutes(date: Date, minutes: number): Date {
    return new Date(date.getTime() + minutes * 60000);
  }

  // Subtract minutes from a Date object
  static subtractMinutes(date: Date, minutes: number): Date {
    return new Date(date.getTime() - minutes * 60000);
  }

  // Format a Date object to 'YYYY-MM-DD'
  static formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  // Format a Date object to 'HH:mm:ss'
  static formatTime(date: Date): string {
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const seconds = date.getSeconds().toString().padStart(2, "0");
    return `${hours}:${minutes}:${seconds}`;
  }

  // Return the start of the day (00:00:00)
  static startOfDay(date: Date): Date {
    const newDate = new Date(date);
    newDate.setHours(0, 0, 0, 0);
    return newDate;
  }

  // Return the end of the day (23:59:59)
  static endOfDay(date: Date): Date {
    const newDate = new Date(date);
    newDate.setHours(23, 59, 59, 999);
    return newDate;
  }
  // Check if a date falls within a given date range (inclusive)
  static isDateInRange(date: Date, startDate: Date, endDate: Date): boolean {
    const dateValue = date.setHours(0, 0, 0, 0);
    const startValue = startDate.setHours(0, 0, 0, 0);
    const endValue = endDate.setHours(0, 0, 0, 0);
    return dateValue >= startValue && dateValue <= endValue;
  }

  // Check if a date-time falls within a given date-time range (inclusive)
  static isDateTimeInRange(
    dateTime: Date,
    startDateTime: Date,
    endDateTime: Date
  ): boolean {
    return (
      dateTime.getTime() >= startDateTime.getTime() &&
      dateTime.getTime() <= endDateTime.getTime()
    );
  }

  // Check if the time of a date falls within the time range of two other dates (inclusive)
  static isTimeInRange(time: Date, startTime: Date, endTime: Date): boolean {
    const targetTime = time.getHours() * 60 + time.getMinutes();
    const start = startTime.getHours() * 60 + startTime.getMinutes();
    const end = endTime.getHours() * 60 + endTime.getMinutes();
    return targetTime >= start && targetTime <= end;
  }

  // Convert a date to a specified time zone offset (in minutes)
  static convertToTimeZone(date: Date, offsetInMinutes: number): Date {
    const localTime = date.getTime();
    const localOffset = date.getTimezoneOffset();
    const targetTime = localTime + (offsetInMinutes - localOffset) * 60000;
    return new Date(targetTime);
  }

  // Return the difference in days between two dates
  static dateDiffInDays(date1: Date, date2: Date): number {
    const diffInMs = date1.getTime() - date2.getTime();
    return Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  }

  // Return the difference in hours between two dates
  static dateDiffInHours(date1: Date, date2: Date): number {
    const diffInMs = date1.getTime() - date2.getTime();
    return Math.floor(diffInMs / (1000 * 60 * 60));
  }

  // Return the difference in minutes between two dates
  static dateDiffInMinutes(date1: Date, date2: Date): number {
    const diffInMs = date1.getTime() - date2.getTime();
    return Math.floor(diffInMs / (1000 * 60));
  }

  // Return the difference in seconds between two dates
  static dateDiffInSeconds(date1: Date, date2: Date): number {
    const diffInMs = date1.getTime() - date2.getTime();
    return Math.floor(diffInMs / 1000);
  }

  // Check if the given date is within the last 'n' minutes from now
  static isWithinLastMinutes(date: Date, minutes: number): boolean {
    const now = new Date();
    const diffInMinutes = this.dateDiffInMinutes(now, date);
    return diffInMinutes <= minutes && diffInMinutes >= 0;
  }

  // Check if the given date is within the next 'n' minutes from now
  static isWithinNextMinutes(date: Date, minutes: number): boolean {
    const now = new Date();
    const diffInMinutes = this.dateDiffInMinutes(date, now);
    return diffInMinutes <= minutes && diffInMinutes >= 0;
  }

  // Check if the given date is within the next or last 'n' minutes from now
  static isWithinNextOrLastMinutes(date: Date, minutes: number): boolean {
    return (
      this.isWithinLastMinutes(date, minutes) ||
      this.isWithinNextMinutes(date, minutes)
    );
  }
}

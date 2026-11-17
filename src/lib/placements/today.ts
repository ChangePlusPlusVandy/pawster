// TODO: confirm shelter time zone with the team.
export const SHELTER_TIME_ZONE = "America/Chicago";

// Returns today's date as YYYY-MM-DD in the shelter's time zone.
// The "en-CA" locale formats dates as YYYY-MM-DD.
export function todayInShelterTimeZone(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: SHELTER_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

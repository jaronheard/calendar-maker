type Event = {
  title: string
  day: string
  startTime: string
  endTime: string
  description?: string
}

export function generateICalString(events: Event[]): string {
  // Basic iCal format
  let icalString = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Weekly Calendar Maker//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ].join("\r\n")

  // Helper to get day number for RRULE
  const getDayNumber = (day: string): string => {
    const days: Record<string, string> = {
      sunday: "SU",
      monday: "MO",
      tuesday: "TU",
      wednesday: "WE",
      thursday: "TH",
      friday: "FR",
      saturday: "SA",
    }

    // If it's already a date in YYYY-MM-DD format
    if (day.includes("-")) {
      const date = new Date(day)
      const dayName = date.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase()
      return days[dayName] || "MO" // Default to Monday if not found
    }

    return days[day.toLowerCase()] || "MO"
  }

  // Generate a unique ID for each event
  const generateUID = () => {
    return `event-${Math.random().toString(36).substring(2, 11)}-${Date.now()}`
  }

  // Add each event to the calendar
  events.forEach((event) => {
    // Create a date for this event (using next occurrence of the day)
    let eventDate: Date

    if (event.day.includes("-")) {
      // If it's already a date in YYYY-MM-DD format
      eventDate = new Date(event.day)
    } else {
      // Find the next occurrence of this day
      const dayNumber = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"].findIndex(
        (d) => d === event.day.toLowerCase(),
      )

      const today = new Date()
      const currentDayNumber = today.getDay() // 0 = Sunday, 1 = Monday, etc.

      // Calculate days to add
      let daysToAdd = dayNumber - currentDayNumber
      if (daysToAdd <= 0) daysToAdd += 7 // If it's in the past, get next week

      eventDate = new Date(today)
      eventDate.setDate(today.getDate() + daysToAdd)
    }

    // Format the date as YYYYMMDD
    const dateString = eventDate.toISOString().split("T")[0].replace(/-/g, "")

    // Format times (remove any colons)
    const startTime = event.startTime.replace(":", "")
    const endTime = event.endTime.replace(":", "")

    // Create the event
    icalString +=
      "\r\n" +
      [
        "BEGIN:VEVENT",
        `UID:${generateUID()}`,
        `SUMMARY:${event.title}`,
        `DTSTART:${dateString}T${startTime}00`,
        `DTEND:${dateString}T${endTime}00`,
        `RRULE:FREQ=WEEKLY;BYDAY=${getDayNumber(event.day)}`,
        event.description ? `DESCRIPTION:${event.description}` : "",
        "END:VEVENT",
      ]
        .filter(Boolean)
        .join("\r\n")
  })

  // Close the calendar
  icalString += "\r\nEND:VCALENDAR"

  return icalString
}


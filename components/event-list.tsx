import { CalendarDays, Clock } from "lucide-react"

type Event = {
  title: string
  day: string
  startTime: string
  endTime: string
  description?: string
}

interface EventListProps {
  events: Event[]
}

export function EventList({ events }: EventListProps) {
  // Helper function to format day names
  const formatDay = (day: string) => {
    // If day is in YYYY-MM-DD format, extract day name
    if (day.includes("-")) {
      const date = new Date(day)
      return date.toLocaleDateString("en-US", { weekday: "long" })
    }
    return day
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Parsed Events</h2>
      <div className="divide-y">
        {events.map((event, index) => (
          <div key={index} className="py-4 first:pt-0 last:pb-0">
            <h3 className="font-medium text-lg">{event.title}</h3>
            <div className="flex items-center gap-2 text-muted-foreground mt-1">
              <CalendarDays className="h-4 w-4" />
              <span>{formatDay(event.day)}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground mt-1">
              <Clock className="h-4 w-4" />
              <span>
                {event.startTime} - {event.endTime}
              </span>
            </div>
            {event.description && <p className="mt-2 text-sm text-muted-foreground">{event.description}</p>}
          </div>
        ))}
      </div>
    </div>
  )
}


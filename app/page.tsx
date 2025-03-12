import { CalendarForm } from "@/components/calendar-form"

export default function Home() {
  return (
    <div className="container mx-auto py-10 px-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6 text-center">Weekly Calendar Maker</h1>
      <p className="text-muted-foreground mb-8 text-center">
        Enter your events in any format and we'll convert them to calendar events
      </p>
      <CalendarForm />
    </div>
  )
}


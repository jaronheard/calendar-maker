"use client"

import type React from "react"

import { useState } from "react"
import { Loader2, Calendar, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { EventList } from "./event-list"
import { generateICalString } from "@/lib/ical"

type Event = {
  title: string
  day: string
  startTime: string
  endTime: string
  description?: string
}

export function CalendarForm() {
  const [input, setInput] = useState("")
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    setLoading(true)
    try {
      const response = await fetch("/api/parse-events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: input }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error("Server error:", errorData)
        throw new Error(errorData.error || "Failed to parse events")
      }

      const data = await response.json()
      setEvents(data.events)
    } catch (error) {
      console.error("Error parsing events:", error)
      alert(`Error: ${error.message || "Failed to parse events. Please try again."}`)
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = () => {
    if (events.length === 0) return

    const icalString = generateICalString(events)
    const blob = new Blob([icalString], { type: "text/calendar" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "weekly-events.ics"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleAddToGoogle = () => {
    if (events.length === 0) return

    // For each event, create a Google Calendar link
    events.forEach((event) => {
      const title = encodeURIComponent(event.title)
      const description = encodeURIComponent(event.description || "")

      // Format dates for Google Calendar
      // Note: This is simplified and would need more robust date handling in production
      const startDate = encodeURIComponent(`${event.day}T${event.startTime}:00`)
      const endDate = encodeURIComponent(`${event.day}T${event.endTime}:00`)

      const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${description}&dates=${startDate}/${endDate}&recur=RRULE:FREQ=WEEKLY`

      window.open(url, "_blank")
    })
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Textarea
          placeholder="Enter your events in any format. For example:
Monday: Team meeting from 9am to 10am
Tuesday: Lunch with John at 12:30pm
Every Wednesday: Yoga class at 6pm for 1 hour"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="min-h-[200px]"
        />
        <Button type="submit" disabled={loading || !input.trim()} className="w-full">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            "Parse Events"
          )}
        </Button>
      </form>

      {events.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <EventList events={events} />
            <div className="flex gap-4 mt-6">
              <Button onClick={handleDownload} className="flex-1">
                <Download className="mr-2 h-4 w-4" />
                Download iCal
              </Button>
              <Button onClick={handleAddToGoogle} variant="outline" className="flex-1">
                <Calendar className="mr-2 h-4 w-4" />
                Add to Google Calendar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}


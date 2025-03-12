"use client";

import type React from "react";

import { useState } from "react";
import { Loader2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { EventList } from "./event-list";
import { generateICalString } from "@/lib/ical";

type Event = {
  title: string;
  day: string;
  startTime: string;
  endTime: string;
  description?: string;
};

export function CalendarForm() {
  const [input, setInput] = useState("");
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setLoading(true);
    try {
      const response = await fetch("/api/parse-events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: input }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Server error:", errorData);
        throw new Error(errorData.error || "Failed to parse events");
      }

      const data = await response.json();
      setEvents(data.events);
    } catch (error) {
      console.error("Error parsing events:", error);
      alert(
        `Error: ${
          error instanceof Error
            ? error.message
            : "Failed to parse events. Please try again."
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (events.length === 0) return;

    const icalString = generateICalString(events);
    const blob = new Blob([icalString], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "weekly-events.ics";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

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
        <Button
          type="submit"
          disabled={loading || !input.trim()}
          className="w-full"
        >
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
            <div className="mt-6">
              <Button onClick={handleDownload} className="w-full">
                <Download className="mr-2 h-4 w-4" />
                Download iCal
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

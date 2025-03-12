import { NextResponse } from "next/server";
import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";

// Set a longer timeout for the OpenAI API call
export const maxDuration = 60; // This extends the function timeout to 60 seconds

// Define the Zod schema for an event
const EventSchema = z.object({
  title: z.string().min(1, "Title is required"),
  day: z.string().min(1, "Day is required"),
  startTime: z
    .string()
    .regex(
      /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,
      "Start time must be in 24-hour format (HH:MM)"
    ),
  endTime: z
    .string()
    .regex(
      /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,
      "End time must be in 24-hour format (HH:MM)"
    ),
  description: z.string().optional(),
});

// Define the array schema
const EventsArraySchema = z.array(EventSchema);

export async function POST(req: Request) {
  try {
    const { text } = await req.json();

    if (!text) {
      return NextResponse.json(
        { error: "Text input is required" },
        { status: 400 }
      );
    }

    const prompt = `
      Extract weekly recurring events from the following text.
      
      For each event:
      - Title should be descriptive and clear
      - Day should be a weekday name (e.g., "Monday") or in YYYY-MM-DD format for specific dates
      - Times must be in 24-hour format (HH:MM)
      - If only a start time with duration is mentioned, calculate the end time
      - Include any description if available
      
      Input text:
      ${text}
    `;

    try {
      // Using generateObject with our EventsArraySchema directly
      const { object: events } = await generateObject({
        model: openai("o3-mini", {
          structuredOutputs: true, // Enable structured outputs for the model
        }),
        prompt,
        schema: EventsArraySchema,
        temperature: 0.2, // Lower temperature for more consistent results
        maxTokens: 1500, // Limit response size
      });

      return NextResponse.json({ events });
    } catch (error: unknown) {
      console.error("OpenAI API error:", error);
      return NextResponse.json(
        {
          error: "Error communicating with AI service",
          details: error instanceof Error ? error.message : String(error),
        },
        { status: 500 }
      );
    }
  } catch (error: unknown) {
    console.error("Error processing request:", error);
    return NextResponse.json(
      {
        error: "An error occurred while processing your request",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";

// Set a longer timeout for the OpenAI API call
export const maxDuration = 60; // This extends the function timeout to 60 seconds

// Define the Zod schema for an event with workaround for OpenAI's strict schema requirements
const EventSchema = z.object({
  title: z.string().describe("The title or name of the event"),
  day: z.string().describe("Day of the week or date in YYYY-MM-DD format"),
  startTime: z.string().describe("Start time in 24-hour format (HH:MM)"),
  endTime: z.string().describe("End time in 24-hour format (HH:MM)"),
  // For OpenAI compatibility, don't mark as optional in the schema
  description: z.string().describe("Description of the event (can be empty)"),
});

// Define the array schema wrapped in an object to comply with OpenAI's requirements
const EventsArraySchema = z.object({
  events: z.array(EventSchema),
});

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
      
      If no events are found, return an empty array.
      
      Input text:
      ${text}
    `;

    try {
      // Using generateObject with our EventsArraySchema directly
      const { object } = await generateObject({
        model: openai("o3-mini", {
          structuredOutputs: true, // Enable structured outputs for the model
        }),
        prompt,
        schema: EventsArraySchema,
        temperature: 0.1, // Lower temperature for more consistent results
        maxTokens: 20000, // Increase max tokens to give more room for response
      });

      // Return empty array if no events were generated
      return NextResponse.json({
        events:
          object.events && Array.isArray(object.events) ? object.events : [],
      });
    } catch (error: unknown) {
      console.error("OpenAI API error:", error);

      // If we can't parse the response, return an empty array
      if (
        error instanceof Error &&
        (error.message.includes("JSONParseError") ||
          error.message.includes("NoObjectGeneratedError"))
      ) {
        return NextResponse.json({ events: [] });
      }

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

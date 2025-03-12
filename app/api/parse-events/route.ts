import { NextResponse } from "next/server"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

// Set a longer timeout for the OpenAI API call
export const maxDuration = 60 // This extends the function timeout to 60 seconds

export async function POST(req: Request) {
  try {
    const { text } = await req.json()

    if (!text) {
      return NextResponse.json({ error: "Text input is required" }, { status: 400 })
    }

    const prompt = `
      Parse the following text into structured weekly recurring events.
      For each event, extract:
      1. Title of the event
      2. Day of the week
      3. Start time (in 24-hour format HH:MM)
      4. End time (in 24-hour format HH:MM)
      5. Description (if available)

      If a specific date is mentioned instead of a day, convert it to a day of the week.
      If only a start time is mentioned with a duration, calculate the end time.
      
      Format the response as a JSON array of events with the following structure:
      [
        {
          "title": "Event title",
          "day": "Monday", // or YYYY-MM-DD format if a specific date is given
          "startTime": "09:00",
          "endTime": "10:00",
          "description": "Optional description"
        }
      ]

      Input text:
      ${text}
    `

    try {
      const { text: responseText } = await generateText({
        model: openai("o3-mini"), // Using o3-mini model for better performance
        prompt,
        temperature: 0.2, // Lower temperature for more consistent results
        maxTokens: 1500, // Limit response size
      })

      // Extract the JSON array from the response
      let events = []
      try {
        // Find JSON in the response (it might be wrapped in markdown code blocks)
        const jsonMatch = responseText.match(/\[[\s\S]*\]/)
        if (jsonMatch) {
          events = JSON.parse(jsonMatch[0])
        } else {
          events = JSON.parse(responseText)
        }
      } catch (error) {
        console.error("Error parsing JSON from AI response:", error)
        console.error("Raw response:", responseText)
        return NextResponse.json(
          { error: "Failed to parse events from the input", details: responseText },
          { status: 500 },
        )
      }

      return NextResponse.json({ events })
    } catch (error) {
      console.error("OpenAI API error:", error)
      return NextResponse.json(
        { error: "Error communicating with AI service", details: error.message },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error processing request:", error)
    return NextResponse.json(
      { error: "An error occurred while processing your request", details: error.message },
      { status: 500 },
    )
  }
}


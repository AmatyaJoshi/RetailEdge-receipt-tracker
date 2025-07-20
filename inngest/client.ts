import { Inngest } from 'inngest';

// Create a client to send and receive events
export const inngest = new Inngest({
    id: "receipt-tracker",
    name: "Receipt Tracker",
    eventKey: process.env.INNGEST_EVENT_KEY, // Added for event authentication
    credentials: {
        gemini: {
            apiKey: process.env.GEMINI_API_KEY,
        },
    },
});

import type { ChatContact, ChatMessage } from "../types/chat.types";

export const DEMO_CONTACT: ChatContact = {
  id: "contact-emma",
  name: "Emma Smith",
  isOnline: true,
};

export const DEMO_MESSAGES: ChatMessage[] = [
  {
    id: "m1",
    side: "incoming",
    text: "Hey! Are we still on for the project sync later?",
    sentAt: "2026-10-28T09:12:00.000Z",
  },
  {
    id: "m2",
    side: "outgoing",
    text: "Yes — 4 PM works for me. I'll share the notes beforehand.",
    sentAt: "2026-10-28T09:13:20.000Z",
    status: "read",
  },
  {
    id: "m3",
    side: "incoming",
    text: "Perfect. Also dropping the moodboard in the group.",
    sentAt: "2026-10-28T09:14:05.000Z",
  },
  {
    id: "m4",
    side: "outgoing",
    text: "Love it. The purple + white direction feels clean.",
    sentAt: "2026-10-28T09:15:40.000Z",
    status: "read",
  },
  {
    id: "m5",
    side: "incoming",
    text: "Glad you like it ✨ Want me to nudge the team?",
    sentAt: "2026-10-29T07:02:00.000Z",
  },
  {
    id: "m6",
    side: "outgoing",
    text: "Yes please. Keep the thread light and focused.",
    sentAt: "2026-10-29T07:03:15.000Z",
    status: "delivered",
  },
  {
    id: "m7",
    side: "incoming",
    text: "Done. See you at four!",
    sentAt: "2026-10-29T07:04:10.000Z",
  },
];

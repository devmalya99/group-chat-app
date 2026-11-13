"use client";

import { useState, type FormEvent } from "react";
import { PrimaryButton } from "@/shared/components/PrimaryButton";
import { TextField } from "@/shared/components/TextField";
import type { LookupUser } from "../types/chat.types";

interface RoomJoinFormProps {
  joinedPeer: LookupUser | null;
  activeRoomId: string | null;
  joining: boolean;
  disabled?: boolean;
  onJoin: (peerEmail: string) => Promise<void>;
}

export function RoomJoinForm({
  joinedPeer,
  activeRoomId,
  joining,
  disabled = false,
  onJoin,
}: RoomJoinFormProps) {
  const [email, setEmail] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = email.trim();
    if (!next || disabled || joining) {
      return;
    }
    await onJoin(next);
  }

  return (
    <div className="shrink-0 border-b border-slate-100 bg-white/90 px-4 py-3">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-2 sm:flex-row sm:items-end"
      >
        <div className="min-w-0 flex-1">
          <TextField
            label="Chat with (email)"
            name="peerEmail"
            type="email"
            autoComplete="email"
            placeholder="friend@email.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={disabled || joining}
          />
        </div>
        <PrimaryButton
          type="submit"
          loading={joining}
          disabled={disabled || !email.trim()}
          className="sm:w-auto sm:shrink-0 sm:px-6"
        >
          Join room
        </PrimaryButton>
      </form>

      {joinedPeer && activeRoomId ? (
        <p className="mt-2 truncate text-xs text-slate-600">
          Joined room with{" "}
          <span className="font-medium text-slate-800">{joinedPeer.email}</span>
        </p>
      ) : (
        <p className="mt-2 text-xs text-slate-500">
          Enter a registered user email to start a personal chat room.
        </p>
      )}
    </div>
  );
}

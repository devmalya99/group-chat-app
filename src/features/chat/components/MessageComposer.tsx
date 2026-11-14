"use client";

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { usePredictiveTyping } from "../hooks/usePredictiveTyping";
import { useSmartReplies } from "../hooks/useSmartReplies";
import type { ChatMessage } from "../types/chat.types";
import { appendToDraft } from "../utils/appendToDraft";
import { acceptAttributeForFileInput } from "../utils/filePolicy";
import { ComposerSuggestionRail } from "./ComposerSuggestionRail";
import { ComposerTextarea } from "./ComposerTextarea";
import {
  EmojiIcon,
  MicIcon,
  PlusIcon,
  SendIcon,
  SpinnerIcon,
} from "./MessageComposerIcons";

interface MessageComposerProps {
  onSend: (text: string) => void | Promise<void>;
  onSendFile?: (file: File) => void | Promise<void>;
  disabled?: boolean;
  uploading?: boolean;
  placeholder?: string;
  messages?: ChatMessage[];
  roomId?: string | null;
  currentUserId?: string | null;
  predictiveEnabled?: boolean;
  smartRepliesEnabled?: boolean;
}

export function MessageComposer({
  onSend,
  onSendFile,
  disabled = false,
  uploading = false,
  placeholder = "Type a message...",
  messages = [],
  roomId = null,
  currentUserId = null,
  predictiveEnabled = false,
  smartRepliesEnabled = false,
}: MessageComposerProps) {
  const [text, setText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const handleFile = onSendFile;
  const controlsDisabled = disabled || uploading;

  const { suggestion, acceptSuggestion, clearSuggestion } = usePredictiveTyping({
    draft: text,
    messages,
    roomId,
    currentUserId,
    enabled: predictiveEnabled && !controlsDisabled,
  });

  const {
    suggestions: replySuggestions,
    isGenerating: isSmartRepliesGenerating,
    hasIncomingTarget,
    clearSuggestions: clearSmartReplies,
  } = useSmartReplies({
    messages,
    roomId,
    currentUserId,
    // Do not tie to controlsDisabled — send/upload must not reset completed id / re-fetch.
    enabled: smartRepliesEnabled,
  });

  const wordSuggestions =
    !controlsDisabled && suggestion.trim() ? [suggestion.trim()] : [];

  useEffect(() => {
    if (disabled) {
      setText("");
      clearSuggestion();
      clearSmartReplies();
    }
  }, [disabled, clearSuggestion, clearSmartReplies]);

  function focusDraftAt(caret: number) {
    requestAnimationFrame(() => {
      const node = textareaRef.current;
      if (!node) {
        return;
      }
      node.focus();
      node.setSelectionRange(caret, caret);
    });
  }

  function applySuggestion(
    suggestionText: string,
    options: { padSpace: boolean; clearReplies?: boolean },
  ) {
    if (controlsDisabled || !suggestionText) {
      return;
    }

    const { nextText, nextCaret } = appendToDraft({
      text,
      suggestion: suggestionText,
      padSpace: options.padSpace,
    });
    setText(nextText);
    clearSuggestion();
    if (options.clearReplies) {
      clearSmartReplies();
    }
    focusDraftAt(nextCaret);
  }

  function submit() {
    const next = text.trim();
    if (!next || controlsDisabled) {
      return;
    }
    void onSend(next);
    setText("");
    clearSuggestion();
    clearSmartReplies();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    submit();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (controlsDisabled) {
      event.preventDefault();
      return;
    }

    if (event.key === "Tab" && !event.shiftKey && wordSuggestions.length > 0) {
      event.preventDefault();
      const accepted = acceptSuggestion();
      if (accepted) {
        applySuggestion(accepted, { padSpace: false });
      }
      return;
    }

    if (event.key === "Escape" && wordSuggestions.length > 0) {
      event.preventDefault();
      clearSuggestion();
      return;
    }

    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  }

  function openFilePicker() {
    if (controlsDisabled || !handleFile) {
      return;
    }
    fileInputRef.current?.click();
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file || !handleFile || controlsDisabled) {
      return;
    }

    void handleFile(file);
  }

  const showSmartReplyRow =
    smartRepliesEnabled &&
    hasIncomingTarget &&
    (replySuggestions.length > 0 || isSmartRepliesGenerating);

  return (
    <ComposerSuggestionRail
      showSmartReplies={showSmartReplyRow}
      isGeneratingReplies={isSmartRepliesGenerating}
      replySuggestions={replySuggestions}
      wordSuggestions={wordSuggestions}
      disabled={controlsDisabled}
      onSelectReply={(value) =>
        applySuggestion(value, { padSpace: true, clearReplies: true })
      }
      onSelectWord={(value) => applySuggestion(value, { padSpace: false })}
    >
      <form
        onSubmit={handleSubmit}
        aria-disabled={controlsDisabled}
        className={controlsDisabled ? "opacity-70" : ""}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptAttributeForFileInput()}
          className="hidden"
          onChange={handleFileChange}
        />

        <div className="mx-auto flex w-full max-w-2xl items-end gap-2">
          <button
            type="button"
            disabled={controlsDisabled || !handleFile}
            onClick={openFilePicker}
            className="mb-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#6D5BFF] hover:bg-[#f7f5ff] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent"
            aria-label="Upload file"
          >
            <PlusIcon />
          </button>

          <div
            className={`flex min-w-0 flex-1 items-end rounded-[22px] border px-3 py-2 ${
              controlsDisabled
                ? "border-slate-200 bg-slate-100"
                : "border-slate-200 bg-[#f8f7fc]"
            }`}
          >
            <ComposerTextarea
              textareaRef={textareaRef}
              value={text}
              placeholder={uploading ? "Uploading file..." : placeholder}
              disabled={controlsDisabled}
              onChange={setText}
              onKeyDown={handleKeyDown}
            />
            <button
              type="button"
              disabled={controlsDisabled}
              className="mb-0.5 ml-1 shrink-0 text-slate-400 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Emoji"
            >
              <EmojiIcon />
            </button>
          </div>

          {text.trim() && !controlsDisabled ? (
            <button
              type="submit"
              disabled={controlsDisabled}
              className="mb-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#6D5BFF] to-[#4F7CFF] text-white shadow-[0_10px_24px_rgba(109,91,255,0.35)] disabled:cursor-not-allowed disabled:opacity-60"
              aria-label="Send message"
            >
              <SendIcon />
            </button>
          ) : (
            <button
              type="button"
              disabled={controlsDisabled}
              className="mb-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#6D5BFF] to-[#4F7CFF] text-white shadow-[0_10px_24px_rgba(109,91,255,0.35)] disabled:cursor-not-allowed disabled:opacity-60"
              aria-label={uploading ? "Uploading file" : "Voice message"}
            >
              {uploading ? <SpinnerIcon /> : <MicIcon />}
            </button>
          )}
        </div>
      </form>
    </ComposerSuggestionRail>
  );
}

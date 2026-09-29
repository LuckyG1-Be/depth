import { useMemo } from "react";
import { CHAT_FALLBACK_STARTERS, DEPTH_QUESTIONS } from "@/components/chat/constants";
import type { ChatOther, Msg } from "@/components/chat/types";

export type ConversationCoach = {
  tone: "archived" | "unlocked" | "start" | "wait" | "turn";
  title: string;
  body: string;
};

function meaningfulChatText(text: string) {
  const t = String(text || "").trim();
  if (!t) return false;
  if (t.startsWith("🧩")) return false;
  if (t.length < 3) return false;
  return /[A-Za-z0-9À-ÖØ-öø-ÿ]/.test(t);
}

function firstNonEmpty(values: string[]) {
  return values.find((v) => String(v || "").trim().length > 0)?.trim() || null;
}

function cleanSnippet(value: string, max = 92) {
  const normalized = String(value || "").replace(/\s+/g, " ").trim();
  if (normalized.length <= max) return normalized;
  return normalized.slice(0, max - 1).trimEnd() + "…";
}

export function useChatConversationCoach({
  messages,
  meId,
  other,
  text,
  isArchived,
  locked,
  remaining,
  isUnlocked,
  now,
  lastMsgTime,
}: {
  messages: Msg[];
  meId: string;
  other: ChatOther;
  text: string;
  isArchived: boolean;
  locked: boolean;
  remaining: number;
  isUnlocked: boolean;
  now: number;
  lastMsgTime: Date | null;
}) {
  const isNewMatch = messages.length === 0;

  const meaningfulMessages = useMemo(() => messages.filter((m) => meaningfulChatText(m.text)), [messages]);
  const lastMeaningful = meaningfulMessages[meaningfulMessages.length - 1] || null;
  const lastMeaningfulMine = lastMeaningful ? lastMeaningful.fromUserId === meId : false;
  const lastMeaningfulOther = lastMeaningful ? lastMeaningful.fromUserId !== meId : false;

  const isStale = useMemo(() => {
    if (!lastMsgTime) return false;
    if (!now) return false;
    return now - lastMsgTime.getTime() > 24 * 60 * 60 * 1000;
  }, [lastMsgTime, now]);

  const quickReplies = useMemo(() => {
    if (isArchived) return [];
    if (text.trim().length > 0) return [];

    const value = firstNonEmpty(other.values || []);
    const passion = firstNonEmpty(other.passions || []);
    const qa = (other.qa || []).find((x) => x?.a && String(x.a).trim().length > 0);
    const qaReply = qa?.a ? cleanSnippet(qa.a, 74) : null;

    const contextual: string[] = [];
    if (value) contextual.push(`Ik zag dat ${value} belangrijk voor je is. Wat betekent dat voor jou in een relatie?`);
    if (passion) contextual.push(`Je vermeldt ${passion}. Wat vind je daar het fijnste aan?`);
    if (qaReply) contextual.push(`Je antwoord "${qaReply}" bleef hangen. Wil je daar iets meer over vertellen?`);

    if (isNewMatch) return [...contextual, ...CHAT_FALLBACK_STARTERS].slice(0, 3);
    if (locked && lastMeaningfulMine) return [];

    if (locked && lastMeaningfulOther) {
      return [
        "Ik vind dat wel interessant. Voor mij voelt dat zo:",
        "Ik herken daar iets in. Mag ik je iets terugvragen?",
        contextual[0] || DEPTH_QUESTIONS[1],
      ].filter(Boolean).slice(0, 3);
    }

    if (isStale) {
      return [
        "Ik kom hier graag nog even op terug. Hoe kijk jij daar vandaag naar?",
        contextual[0] || DEPTH_QUESTIONS[1],
      ].filter(Boolean).slice(0, 2);
    }

    return contextual.slice(0, 2);
  }, [isArchived, text, isNewMatch, isStale, other.values, other.passions, other.qa, locked, lastMeaningfulMine, lastMeaningfulOther]);

  const conversationCoach = useMemo<ConversationCoach>(() => {
    if (isArchived) {
      return {
        tone: "archived",
        title: "Gesprek gearchiveerd",
        body: "Deze chat is read-only. Je kan de inhoud nog bekijken, maar geen nieuwe berichten sturen.",
      };
    }

    if (!locked || isUnlocked) {
      return {
        tone: "unlocked",
        title: "Foto’s zijn zichtbaar",
        body: "Jullie kunnen nu vrij verder praten.",
      };
    }

    if (isNewMatch) {
      return {
        tone: "start",
        title: "Start rustig en persoonlijk",
        body: "Start met iets dat echt bij het profiel past.",
      };
    }

    if (lastMeaningfulMine) {
      return {
        tone: "wait",
        title: `${other.name || "Je match"} is aan zet`,
        body: `Laat ${other.name || "je match"} even reageren.`,
      };
    }

    return {
      tone: "turn",
      title: "Jij bent aan zet",
      body: remaining > 1
        ? "Reageer inhoudelijk of stel een zachte vervolgvraag."
        : "Eén echte reactie is genoeg.",
    };
  }, [isArchived, locked, isUnlocked, isNewMatch, lastMeaningfulMine, other.name, remaining]);

  return { quickReplies, conversationCoach };
}

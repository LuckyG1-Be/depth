"use client";

import ChatViewLayout from "@/components/chat/ChatViewLayout";
import { useChatViewController } from "@/components/chat/useChatViewController";
import type { ChatViewProps } from "@/components/chat/types";

export default function ChatView(props: ChatViewProps) {
  const controller = useChatViewController(props);
  return <ChatViewLayout {...controller} />;
}

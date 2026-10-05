import type { Metadata } from "next";
import { ChatsView } from "@/components/drishti/chats/ChatsView";

export const metadata: Metadata = {
  title: "Chat history",
};

export default function ChatsPage() {
  return <ChatsView />;
}

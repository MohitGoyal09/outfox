import type { Metadata } from "next";
import { ChatsView } from "@/components/drishti/chats/ChatsView";

export const metadata: Metadata = {
  title: "Chats",
};

export default function ChatsPage() {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2 border-b border-border pb-5">
        <h1 className="type-display text-fg">Chats</h1>
        <p className="type-body max-w-[68ch] text-fg-secondary">
          Every conversation, newest activity first. Search by title to jump back in.
        </p>
      </header>
      <ChatsView />
    </div>
  );
}

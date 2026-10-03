import type { Metadata } from "next";
import { SharedBoardView } from "@/components/drishti/boards/SharedBoardView";

export const metadata: Metadata = {
  title: "Shared board",
  robots: { index: false, follow: false },
};

export default async function SharedBoardRoute({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <SharedBoardView token={token} />;
}

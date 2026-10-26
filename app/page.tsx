"use client";

import dynamic from "next/dynamic";

const OutreachApp = dynamic(
  () => import("@/components/OutreachApp").then((mod) => mod.OutreachApp),
  {
    ssr: false,
    loading: () => (
      <main className="boot">
        <p>Loading your people…</p>
      </main>
    ),
  },
);

export default function HomePage() {
  return <OutreachApp />;
}

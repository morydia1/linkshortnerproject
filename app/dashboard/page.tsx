import { auth } from "@clerk/nextjs/server";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/");

  return (
    <main className="flex flex-1 flex-col gap-4 p-4">
      <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
    </main>
  );
}

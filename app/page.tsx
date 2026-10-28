import { SignUpButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { Link2, MousePointerClick, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: { absolute: "Link Shortener — Short links, simple sharing" },
  description:
    "Create short, memorable links and share them anywhere. Sign up to manage all your links in one dashboard.",
};

const features = [
  {
    icon: Link2,
    title: "Shorten in seconds",
    description:
      "Paste any long URL and get a clean short link you can share anywhere.",
  },
  {
    icon: MousePointerClick,
    title: "Instant redirects",
    description:
      "Visitors who open your short link are sent straight to the original page.",
  },
  {
    icon: ShieldCheck,
    title: "Your links, your account",
    description:
      "Sign in to manage your own links. Only you can see and edit them.",
  },
];

async function RedirectIfSignedIn() {
  const { userId } = await auth();
  if (userId) redirect("/dashboard");
  return null;
}

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center gap-12 px-4 py-16 sm:py-24">
      <Suspense>
        <RedirectIfSignedIn />
      </Suspense>
      <section className="flex max-w-2xl flex-col items-center gap-6 text-center">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Short links, made simple
        </h1>
        <p className="text-lg text-muted-foreground">
          Turn long, unwieldy URLs into short links that are easy to share and
          manage.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <SignUpButton mode="modal" forceRedirectUrl="/dashboard">
            <Button size="lg">Get started</Button>
          </SignUpButton>
        </div>
      </section>
      <section className="grid w-full max-w-4xl gap-4 sm:grid-cols-3">
        {features.map(({ icon: Icon, title, description }) => (
          <Card key={title}>
            <CardHeader>
              <Icon className="mb-2 size-6 text-primary" aria-hidden="true" />
              <CardTitle>{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </section>
    </main>
  );
}

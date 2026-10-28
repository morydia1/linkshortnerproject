import {
  ClerkProvider,
  Show,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";
import { shadcn } from "@clerk/ui/themes";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Link Shortener",
    template: "%s | Link Shortener",
  },
  description: "Create, manage, and share short links.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased [color-scheme:dark]`}
    >
      <body className="min-h-full flex flex-col">
        <ClerkProvider
          appearance={{ theme: shadcn }}
          signInUrl="/"
          signUpUrl="/" 
        >
          <header className="flex h-16 items-center justify-between gap-4 p-4">
            <Link href="/" className="text-lg font-semibold tracking-tight">
              Link Shortener
            </Link>
            <div className="flex items-center gap-4">
              <Suspense>
                <Show when="signed-out">
                  <SignInButton mode="modal" forceRedirectUrl="/dashboard">
                    <Button variant="outline">Sign in</Button>
                  </SignInButton>
                  <SignUpButton mode="modal" forceRedirectUrl="/dashboard">
                    <Button>Sign up</Button>
                  </SignUpButton>
                </Show>
                <Show when="signed-in">
                  <UserButton />
                </Show>
              </Suspense>
            </div>
          </header>
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
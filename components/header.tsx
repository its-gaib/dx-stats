"use client";

import Image from "next/image";
import Link from "next/link";

export function Header() {
  return (
    <header className="absolute top-0 left-0 right-0 z-20 px-4 sm:px-6">
      <div className="mx-auto flex h-20 max-w-[1400px] items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/">
            <Image src="/pubky-logo.svg" alt="Pubky" width={109} height={36} priority />
          </Link>

          <nav className="hidden sm:flex items-center gap-1">
            <span className="rounded-full bg-brand/15 text-brand px-4 py-2 text-sm font-medium">
              DX Stats
            </span>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="https://github.com/pubky"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-5 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-secondary/60"
          >
            GitHub
          </a>
        </div>
      </div>
    </header>
  );
}

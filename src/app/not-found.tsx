import Link from "next/link";
import { ArrowRight } from "@/components/icons";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-full w-full max-w-[720px] flex-col px-4 sm:px-6">
      <div className="flex h-14 items-center">
        <span className="font-display text-[22px] font-semibold leading-none text-ink">Pearl Club</span>
      </div>
      <div className="flex flex-1 flex-col justify-center gap-5 pb-24">
        <h1 className="text-balance font-display text-[40px] font-medium leading-[1.05] tracking-[-0.02em] text-ink sm:text-[56px]">
          This page isn&apos;t on the map.
        </h1>
        <p className="max-w-[46ch] text-[17px] leading-7 text-ink-soft">
          The link may be old or mistyped. Pearl can still find you somewhere good to go.
        </p>
        <Link
          href="/"
          className="inline-flex h-11 w-fit items-center gap-2 rounded-md bg-ink px-5 font-mono text-xs uppercase tracking-[0.08em] text-paper transition-colors hover:bg-ink-soft"
        >
          Ask Pearl
          <ArrowRight size={14} />
        </Link>
      </div>
    </main>
  );
}

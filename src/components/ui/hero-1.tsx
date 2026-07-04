import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { RocketIcon, ArrowRightIcon, PhoneCallIcon } from 'lucide-react';
import { LogoCloud } from '@/components/ui/logo-cloud-3';

export function HeroSection() {
  return (
    <section className="mx-auto w-full max-w-6xl px-3 xs:px-4 sm:px-6 lg:px-8">
      <div className="relative overflow-hidden rounded-xl xs:rounded-2xl lg:rounded-[2rem] border border-border/70 bg-gradient-to-br from-background via-background to-muted/30 px-4 xs:px-6 sm:px-8 lg:px-12 py-12 xs:py-16 sm:py-20 lg:py-24 shadow-[0_35px_90px_-40px_rgba(131,80,232,0.45)] sm:shadow-[0_35px_90px_-40px_rgba(131,80,232,0.45)]">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,oklch(var(--brand)/0.16),transparent_42%)]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 overflow-hidden"
        >
          <div className="absolute inset-y-0 left-2 xs:left-4 w-px bg-gradient-to-b from-transparent via-border/70 to-border sm:left-8" />
          <div className="absolute inset-y-0 right-2 xs:right-4 w-px bg-gradient-to-b from-transparent via-border/70 to-border sm:right-8" />
          <div className="absolute inset-y-0 left-4 xs:left-8 w-px bg-gradient-to-b from-transparent via-border/50 to-border/50 hidden xs:block md:left-12" />
          <div className="absolute inset-y-0 right-4 xs:right-8 w-px bg-gradient-to-b from-transparent via-border/50 to-border/50 hidden xs:block md:right-12" />
        </div>

        <div className="relative flex flex-col items-center justify-center gap-4 xs:gap-5">
          <a
            className={cn(
              'group mx-auto flex w-fit items-center gap-2 xs:gap-3 rounded-full border border-border/70 bg-background/80 px-3 xs:px-4 py-1.5 xs:py-2 text-[11px] xs:text-sm shadow-soft backdrop-blur',
              'animate-in fade-in slide-in-from-bottom-10 fill-mode-backwards transition-all delay-500 duration-500 ease-out',
            )}
            href="#features"
          >
            <RocketIcon className="size-3 xs:size-3.5 text-brand" />
            <span className="text-[11px] xs:text-sm text-foreground/80">35 GB free — no credit card needed</span>
            <span className="block h-4 xs:h-5 border-l border-border/70" />
            <ArrowRightIcon className="size-3 xs:size-3.5 duration-150 ease-out group-hover:translate-x-1" />
          </a>

          <h1
            className={cn(
              'animate-in fade-in slide-in-from-bottom-10 fill-mode-backwards text-balance text-center text-3xl xs:text-4xl sm:text-5xl lg:text-6xl tracking-tight delay-100 duration-500 ease-out',
            )}
          >
            Your files. Your team. <br /> One calm workspace.
          </h1>

          <p className="animate-in fade-in slide-in-from-bottom-10 mx-auto max-w-2xl fill-mode-backwards text-center text-sm xs:text-base sm:text-lg md:text-xl leading-7 sm:leading-8 text-foreground/80 delay-200 duration-500 ease-out px-2">
            TeleVault turns Telegram into a powerful cloud drive — upload, organize, and share files with your team without the usual chaos.
          </p>

          <div className="animate-in fade-in slide-in-from-bottom-10 flex fill-mode-backwards flex-col xs:flex-row flex-wrap items-center justify-center gap-2 xs:gap-3 pt-2 delay-300 duration-500 ease-out">
            <Button className="rounded-full px-4 xs:px-5 shadow-soft w-full xs:w-auto" size="sm" variant="secondary">
              <PhoneCallIcon className="mr-1.5 xs:mr-2 size-3 xs:size-4" />
              <span className="text-xs xs:text-sm">See how it works</span>
            </Button>
            <Button className="rounded-full px-4 xs:px-5 shadow-soft w-full xs:w-auto" size="sm">
              <span className="text-xs xs:text-sm">Start for free</span>
              <ArrowRightIcon className="ml-1.5 xs:ml-2 size-3 xs:size-4" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

export function LogosSection() {
  return (
    <section className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="rounded-[1.5rem] border border-border/70 bg-background/70 px-6 py-8 shadow-soft backdrop-blur">
        <h2 className="text-center text-lg font-medium tracking-tight text-muted-foreground md:text-xl">
          Built on tools trusted by <span className="text-foreground">world-class teams</span>
        </h2>
        <div className="relative z-10 mx-auto mt-6 max-w-4xl">
          <LogoCloud logos={logos} />
        </div>
      </div>
    </section>
  );
}

const logos = [
  {
    src: 'https://storage.efferd.com/logo/nvidia-wordmark.svg',
    alt: 'Nvidia Logo',
  },
  {
    src: 'https://storage.efferd.com/logo/supabase-wordmark.svg',
    alt: 'Supabase Logo',
  },
  {
    src: 'https://storage.efferd.com/logo/openai-wordmark.svg',
    alt: 'OpenAI Logo',
  },
  {
    src: 'https://storage.efferd.com/logo/turso-wordmark.svg',
    alt: 'Turso Logo',
  },
  {
    src: 'https://storage.efferd.com/logo/vercel-wordmark.svg',
    alt: 'Vercel Logo',
  },
  {
    src: 'https://storage.efferd.com/logo/github-wordmark.svg',
    alt: 'GitHub Logo',
  },
  {
    src: 'https://storage.efferd.com/logo/claude-wordmark.svg',
    alt: 'Claude AI Logo',
  },
  {
    src: 'https://storage.efferd.com/logo/clerk-wordmark.svg',
    alt: 'Clerk Logo',
  },
];

import { isTestMode } from "@/lib/tap";

// Saffron strip across the top whenever test keys are in use. Never a button.
export function TestModeBanner({ text }: { text: string }) {
  if (!isTestMode()) return null;
  return (
    <div className="bg-accent px-5 py-2 text-center text-[13px] font-medium text-accent-foreground md:px-10">
      {text}
    </div>
  );
}

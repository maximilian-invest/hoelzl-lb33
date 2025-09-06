import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";

export function MainNav() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="font-semibold">
          ImmoCalc
        </Link>
        <div className="flex items-center gap-4">
          <Link href="#features" className="text-sm text-muted-foreground hover:text-foreground">
            Features
          </Link>
          <Link href="#kontakt" className="text-sm text-muted-foreground hover:text-foreground">
            Kontakt
          </Link>
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}

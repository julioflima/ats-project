import { Menu } from "lucide-react";

import { Button } from "@/components/ui/button";

interface HeaderProps {
  onOpenSidebar: () => void;
}

/**
 * "in top the name of company Leadtech — ATS, follow logo.png"
 * (plan-interface.md via PLAN.md section 3.3). The logo renders as-is — the
 * one stated exception to the grayscale-only constraint.
 */
export function Header({ onOpenSidebar }: HeaderProps) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background px-4">
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={onOpenSidebar}
        aria-label="Open candidate list"
      >
        <Menu />
      </Button>
      <img src="/logo.png" alt="Leadtech" className="h-8 w-auto" />
      <span className="text-lg font-semibold tracking-tight text-foreground">
        ATS
      </span>
    </header>
  );
}

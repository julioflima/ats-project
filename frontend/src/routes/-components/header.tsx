export function Header() {
  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background px-4">
      <img src="/logo.png" alt="Leadtech" className="h-8 w-auto" />
      <span className="text-lg font-semibold tracking-tight text-foreground">ATS</span>
    </header>
  );
}

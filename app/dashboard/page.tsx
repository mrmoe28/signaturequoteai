import { Boxes, FilePlus2 } from "lucide-react";

export default function Dashboard() {
  return (
    <div className="grid gap-6">
      <div className="grid gap-2">
        <h1 className="text-2xl font-extrabold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Quick actions and shortcuts</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <a
          href="/quotes/new"
          className="group relative rounded-xl border border-border bg-gradient-to-br from-primary/5 to-transparent p-5 shadow-sm transition-all hover:shadow-md hover:border-ring"
        >
          <div className="flex items-start gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary ring-1 ring-inset ring-primary/20">
              <FilePlus2 className="h-5 w-5" />
            </span>
            <div className="grid gap-1">
              <div className="font-semibold">New Quote</div>
              <div className="text-sm text-muted-foreground">Start a new customer quote</div>
            </div>
          </div>
        </a>

        <a
          href="/products"
          className="group relative rounded-xl border border-border bg-gradient-to-br from-foreground/[0.03] to-transparent p-5 shadow-sm transition-all hover:shadow-md hover:border-ring"
        >
          <div className="flex items-start gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-foreground/10 text-foreground ring-1 ring-inset ring-foreground/20">
              <Boxes className="h-5 w-5" />
            </span>
            <div className="grid gap-1">
              <div className="font-semibold">Products</div>
              <div className="text-sm text-muted-foreground">Browse the latest catalog</div>
            </div>
          </div>
        </a>
      </div>
    </div>
  );
}
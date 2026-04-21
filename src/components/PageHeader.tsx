import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { monthLabel } from "@/lib/format";

interface Props {
  title: string;
  subtitle?: string;
  onAdd?: () => void;
  addLabel?: string;
  children?: ReactNode;
  monthRef?: Date;
  onMonthChange?: (d: Date) => void;
}

export function PageHeader({ title, subtitle, onAdd, addLabel = "Novo", children, monthRef, onMonthChange }: Props) {
  const stepMonth = (delta: number) => {
    if (!monthRef || !onMonthChange) return;
    const next = new Date(monthRef);
    next.setMonth(next.getMonth() + delta);
    onMonthChange(next);
  };

  return (
    <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2">
        {monthRef && onMonthChange && (
          <div className="flex items-center gap-1 bg-card border rounded-lg pr-1">
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => stepMonth(-1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium px-2 min-w-[140px] text-center capitalize">{monthLabel(monthRef)}</span>
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => stepMonth(1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
        {onAdd && <Button onClick={onAdd} className="h-10 px-4"><Plus className="h-4 w-4 mr-1.5" />{addLabel}</Button>}
        {children}
      </div>
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <Card><CardContent className="py-16 text-center text-sm text-muted-foreground">{message}</CardContent></Card>
  );
}

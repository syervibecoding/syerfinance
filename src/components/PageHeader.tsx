import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface Props {
  title: string;
  subtitle?: string;
  onAdd?: () => void;
  addLabel?: string;
  children?: ReactNode;
}

export function PageHeader({ title, subtitle, onAdd, addLabel = "Novo", children }: Props) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-semibold">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      {onAdd && <Button onClick={onAdd}><Plus className="h-4 w-4 mr-1.5" />{addLabel}</Button>}
      {children}
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <Card><CardContent className="py-16 text-center text-sm text-muted-foreground">{message}</CardContent></Card>
  );
}

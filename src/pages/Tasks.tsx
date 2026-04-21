import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader, EmptyState } from "@/components/PageHeader";
import { toast } from "@/hooks/use-toast";
import { Pencil, Trash2, GripVertical } from "lucide-react";
import {
  DndContext, DragEndEvent, DragOverlay, DragStartEvent,
  PointerSensor, useSensor, useSensors, useDraggable, useDroppable,
} from "@dnd-kit/core";
import { cn } from "@/lib/utils";

const COLUMNS = ["Pendente", "Em Execução", "Concluído"] as const;
const PRIORITIES = ["Baixa", "Normal", "Alta"] as const;

const empty = { title: "", description: "", status: "Pendente", priority: "Normal", client: "", due_date: "" };

export default function Tasks() {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState<any>(empty);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const load = async () => {
    const { data } = await supabase.from("tasks").select("*").order("created_at", { ascending: false });
    setItems(data ?? []);
  };
  useEffect(() => { load(); }, []);

  const openNew = (status: string = "Pendente") => { setEditing(null); setForm({ ...empty, status }); setOpen(true); };
  const openEdit = (it: any) => { setEditing(it); setForm({ ...empty, ...it, due_date: it.due_date ?? "" }); setOpen(true); };

  const save = async () => {
    if (!user) return;
    if (!form.title?.trim()) { toast({ title: "Título obrigatório", variant: "destructive" }); return; }
    const payload: any = { ...form, user_id: user.id };
    if (!payload.due_date) payload.due_date = null;
    if (!payload.client) payload.client = null;
    const res = editing
      ? await supabase.from("tasks").update(payload).eq("id", editing.id)
      : await supabase.from("tasks").insert(payload);
    if (res.error) toast({ title: "Erro", description: res.error.message, variant: "destructive" });
    else { toast({ title: editing ? "Atualizada" : "Criada" }); setOpen(false); load(); }
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir tarefa?")) return;
    await supabase.from("tasks").delete().eq("id", id);
    load();
  };

  const handleDragStart = (e: DragStartEvent) => setActiveId(String(e.active.id));
  const handleDragEnd = async (e: DragEndEvent) => {
    setActiveId(null);
    const taskId = String(e.active.id);
    const newStatus = e.over?.id ? String(e.over.id) : null;
    if (!newStatus || !COLUMNS.includes(newStatus as any)) return;
    const task = items.find(i => i.id === taskId);
    if (!task || task.status === newStatus) return;
    setItems(prev => prev.map(i => i.id === taskId ? { ...i, status: newStatus } : i));
    await supabase.from("tasks").update({ status: newStatus }).eq("id", taskId);
  };

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));
  const activeTask = items.find(i => i.id === activeId);

  return (
    <div>
      <PageHeader title="Quadro de Atividades" subtitle="Arraste e solte tarefas entre as colunas" onAdd={() => openNew()} addLabel="Nova tarefa" />

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {COLUMNS.map(col => {
            const colItems = items.filter(i => i.status === col);
            return (
              <Column key={col} id={col} title={col} count={colItems.length} onAdd={() => openNew(col)}>
                {colItems.length === 0 && <p className="text-xs text-muted-foreground text-center py-8">Sem tarefas</p>}
                {colItems.map(it => (
                  <TaskCard key={it.id} task={it} onEdit={() => openEdit(it)} onRemove={() => remove(it.id)} />
                ))}
              </Column>
            );
          })}
        </div>
        <DragOverlay>
          {activeTask && <div className="bg-card border rounded-lg p-3 shadow-lg rotate-2 opacity-90 w-[260px]"><div className="font-medium text-sm">{activeTask.title}</div></div>}
        </DragOverlay>
      </DndContext>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Editar tarefa" : "Nova tarefa"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2 space-y-1.5"><Label className="text-xs">Título</Label><Input value={form.title} onChange={e => set("title", e.target.value)} /></div>
            <div className="col-span-2 space-y-1.5"><Label className="text-xs">Descrição</Label><Textarea value={form.description} onChange={e => set("description", e.target.value)} rows={3} /></div>
            <F label="Status">
              <Select value={form.status} onValueChange={v => set("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{COLUMNS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </F>
            <F label="Prioridade">
              <Select value={form.priority} onValueChange={v => set("priority", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PRIORITIES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </F>
            <F label="Cliente"><Input value={form.client ?? ""} onChange={e => set("client", e.target.value)} /></F>
            <F label="Vencimento"><Input type="date" value={form.due_date} onChange={e => set("due_date", e.target.value)} /></F>
          </div>
          <DialogFooter><Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button><Button onClick={save}>Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Column({ id, title, count, children, onAdd }: any) {
  const { isOver, setNodeRef } = useDroppable({ id });
  return (
    <div ref={setNodeRef} className={cn("rounded-xl bg-secondary/40 p-3 transition-colors", isOver && "bg-primary-soft ring-2 ring-primary/30")}>
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm">{title}</h3>
          <Badge variant="outline" className="bg-card">{count}</Badge>
        </div>
        <Button variant="ghost" size="sm" onClick={onAdd} className="h-7 text-xs">+ Tarefa</Button>
      </div>
      <div className="space-y-2 min-h-[200px]">{children}</div>
    </div>
  );
}

function TaskCard({ task, onEdit, onRemove }: any) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task.id });
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;
  const priorityColor: Record<string, string> = {
    "Alta": "bg-destructive/10 text-destructive border-destructive/20",
    "Normal": "bg-info-soft text-info border-info/20",
    "Baixa": "bg-muted text-muted-foreground",
  };
  return (
    <Card ref={setNodeRef} style={style} className={cn("p-3 cursor-default group hover:shadow-md transition-all", isDragging && "opacity-30")}>
      <div className="flex items-start gap-2">
        <button {...attributes} {...listeners} className="text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing pt-0.5">
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm leading-snug">{task.title}</div>
          {task.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{task.description}</p>}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {task.client && <Badge variant="outline" className="text-[10px] py-0">{task.client}</Badge>}
            {task.priority && <Badge variant="outline" className={cn("text-[10px] py-0", priorityColor[task.priority])}>{task.priority}</Badge>}
            {task.due_date && <Badge variant="outline" className="text-[10px] py-0">{new Date(task.due_date).toLocaleDateString("pt-BR")}</Badge>}
          </div>
        </div>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex flex-col">
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onEdit}><Pencil className="h-3 w-3" /></Button>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onRemove}><Trash2 className="h-3 w-3" /></Button>
        </div>
      </div>
    </Card>
  );
}

function F({ label, children }: any) { return <div className="space-y-1.5"><Label className="text-xs">{label}</Label>{children}</div>; }

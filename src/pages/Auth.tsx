import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function Auth() {
  const nav = useNavigate();
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (user) nav("/"); }, [user, nav]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) toast({ title: "Erro ao entrar", description: error.message, variant: "destructive" });
    else nav("/");
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { emailRedirectTo: `${window.location.origin}/` }
    });
    setLoading(false);
    if (error) toast({ title: "Erro no cadastro", description: error.message, variant: "destructive" });
    else toast({ title: "Conta criada", description: "Você já pode entrar." });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary/40 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto h-10 w-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold mb-2">SR</div>
          <CardTitle>Grupo SR</CardTitle>
          <CardDescription>Acesso ao painel executivo</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="signin">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Criar conta</TabsTrigger>
            </TabsList>
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-3">
                <div className="space-y-1.5"><Label>Email</Label><Input type="email" required value={email} onChange={e => setEmail(e.target.value)} /></div>
                <div className="space-y-1.5"><Label>Senha</Label><Input type="password" required value={password} onChange={e => setPassword(e.target.value)} /></div>
                <Button className="w-full" disabled={loading}>{loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Entrar</Button>
              </form>
            </TabsContent>
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-3">
                <div className="space-y-1.5"><Label>Email</Label><Input type="email" required value={email} onChange={e => setEmail(e.target.value)} /></div>
                <div className="space-y-1.5"><Label>Senha</Label><Input type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)} /></div>
                <Button className="w-full" disabled={loading}>{loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Cadastrar</Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

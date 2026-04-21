import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import AppLayout from "@/components/AppLayout";
import Dashboard from "./pages/Dashboard";
import ServicesByCategory from "./pages/ServicesByCategory";
import Maintenance from "./pages/Maintenance";
import TrafficCalendar from "./pages/TrafficCalendar";
import Tasks from "./pages/Tasks";
import Expenses from "./pages/Expenses";
import Portfolio from "./pages/Portfolio";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/projetos" element={<ServicesByCategory category="Plataformas" title="Projetos & Plataformas" />} />
              <Route path="/marketing" element={<ServicesByCategory category="Marketing" title="Serviços Marketing" />} />
              <Route path="/sites" element={<ServicesByCategory category="Sites" title="Sites" />} />
              <Route path="/manutencao" element={<Maintenance />} />
              <Route path="/trafego" element={<TrafficCalendar />} />
              <Route path="/portfolio" element={<Portfolio />} />
              <Route path="/atividades" element={<Tasks />} />
              <Route path="/despesas" element={<Expenses />} />
              <Route path="/servicos" element={<Navigate to="/marketing" replace />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

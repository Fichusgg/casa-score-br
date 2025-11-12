import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Home, TrendingUp, MapPin } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Analysis = Tables<"analyses">;

export default function History() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (!session) {
        navigate("/auth");
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session) {
        navigate("/auth");
      } else {
        loadAnalyses();
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const loadAnalyses = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("analyses")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Erro ao carregar análises",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setAnalyses(data || []);
    }
    setLoading(false);
  };

  const deleteAnalysis = async (id: string) => {
    const { error } = await supabase
      .from("analyses")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "Erro ao deletar",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Análise deletada",
      });
      setAnalyses(analyses.filter(a => a.id !== id));
    }
  };

  const getVerdictColor = (verdict: string | null) => {
    switch (verdict) {
      case "good": return "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400";
      case "fair": return "bg-amber-500/20 text-amber-700 dark:text-amber-400";
      case "overpriced": return "bg-red-500/20 text-red-700 dark:text-red-400";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getVerdictLabel = (verdict: string | null) => {
    switch (verdict) {
      case "good": return "🟢 Bom";
      case "fair": return "🟡 Razoável";
      case "overpriced": return "🔴 Caro";
      default: return "—";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/10 to-background flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/10 to-background">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Minhas Análises</h1>
            <p className="text-muted-foreground">{analyses.length} análises salvas</p>
          </div>
          <Button variant="outline" onClick={() => navigate("/")}>
            <Home className="h-4 w-4 mr-2" />
            Início
          </Button>
        </div>

        {analyses.length === 0 ? (
          <Card className="border-border/50">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
                Nenhuma análise salva ainda.
                <br />
                Comece analisando um imóvel!
              </p>
              <Button className="mt-4" onClick={() => navigate("/")}>
                Nova Análise
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {analyses.map((analysis) => {
              const address = analysis.address as any;
              const metrics = analysis.metrics as any;
              const netYield = metrics?.net_yield ? (metrics.net_yield * 100).toFixed(2) : "—";

              return (
                <Card key={analysis.id} className="border-border/50 hover:border-primary/50 transition-colors">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2">{analysis.title}</CardTitle>
                        <CardDescription className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {address?.bairro}, {address?.cidade} - {address?.estado}
                        </CardDescription>
                      </div>
                      <Badge className={getVerdictColor(analysis.verdict)}>
                        {getVerdictLabel(analysis.verdict)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Preço</p>
                        <p className="text-lg font-semibold">
                          {new Intl.NumberFormat("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                            minimumFractionDigits: 0,
                          }).format(analysis.price)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Área</p>
                        <p className="text-lg font-semibold">{analysis.area_m2}m²</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Aluguel Est.</p>
                        <p className="text-lg font-semibold">
                          {analysis.estimated_rent_monthly
                            ? new Intl.NumberFormat("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                              }).format(analysis.estimated_rent_monthly)
                            : "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Yield Líquido</p>
                        <p className="text-lg font-semibold text-primary">{netYield}%</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => navigate(`/analysis?id=${analysis.id}`)}
                      >
                        Ver Detalhes
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteAnalysis(analysis.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

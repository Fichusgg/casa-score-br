import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, MapPin, TrendingUp } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Analysis = Tables<"analyses">;

export default function Comparison() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ids = searchParams.get("ids")?.split(",") || [];
    if (ids.length < 2) {
      toast({
        title: "Selecione pelo menos 2 análises",
        description: "Para comparar, você precisa selecionar no mínimo 2 análises.",
        variant: "destructive",
      });
      navigate("/history");
      return;
    }
    loadAnalyses(ids);
  }, [searchParams, navigate, toast]);

  const loadAnalyses = async (ids: string[]) => {
    setLoading(true);
    const { data, error } = await supabase
      .from("analyses")
      .select("*")
      .in("id", ids);

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

  const formatCurrency = (value: number | null) => {
    if (!value) return "—";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value: number | null) => {
    if (!value) return "—";
    return `${(value * 100).toFixed(2)}%`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/10 to-background flex items-center justify-center">
        <p className="text-muted-foreground">Carregando comparação...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/10 to-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Comparação de Imóveis</h1>
            <p className="text-muted-foreground">Comparando {analyses.length} análises</p>
          </div>
          <Button variant="outline" onClick={() => navigate("/history")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>

        {/* Desktop: Table View */}
        <div className="hidden lg:block overflow-x-auto">
          <Card className="border-border/50">
            <CardContent className="p-0">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left p-4 font-semibold text-muted-foreground w-48">Métrica</th>
                    {analyses.map((analysis) => (
                      <th key={analysis.id} className="p-4 text-center min-w-[200px]">
                        <div className="space-y-2">
                          <p className="font-semibold text-foreground">{analysis.title}</p>
                          <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            <span>{(analysis.address as any)?.bairro}</span>
                          </div>
                          <Badge className={getVerdictColor(analysis.verdict)}>
                            {getVerdictLabel(analysis.verdict)}
                          </Badge>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border/50 hover:bg-muted/50">
                    <td className="p-4 font-medium text-muted-foreground">Preço</td>
                    {analyses.map((a) => (
                      <td key={a.id} className="p-4 text-center font-semibold">{formatCurrency(a.price)}</td>
                    ))}
                  </tr>
                  <tr className="border-b border-border/50 hover:bg-muted/50">
                    <td className="p-4 font-medium text-muted-foreground">Área</td>
                    {analyses.map((a) => (
                      <td key={a.id} className="p-4 text-center font-semibold">{a.area_m2}m²</td>
                    ))}
                  </tr>
                  <tr className="border-b border-border/50 hover:bg-muted/50">
                    <td className="p-4 font-medium text-muted-foreground">Preço/m²</td>
                    {analyses.map((a) => (
                      <td key={a.id} className="p-4 text-center font-semibold">
                        {formatCurrency(Number(a.price) / Number(a.area_m2))}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-border/50 hover:bg-muted/50">
                    <td className="p-4 font-medium text-muted-foreground">Quartos</td>
                    {analyses.map((a) => (
                      <td key={a.id} className="p-4 text-center font-semibold">{a.bedrooms || "—"}</td>
                    ))}
                  </tr>
                  <tr className="border-b border-border/50 hover:bg-muted/50">
                    <td className="p-4 font-medium text-muted-foreground">Valor de Mercado Est.</td>
                    {analyses.map((a) => (
                      <td key={a.id} className="p-4 text-center font-semibold">{formatCurrency(a.estimated_market_value)}</td>
                    ))}
                  </tr>
                  <tr className="border-b border-border/50 hover:bg-muted/50">
                    <td className="p-4 font-medium text-muted-foreground">Aluguel Est. Mensal</td>
                    {analyses.map((a) => (
                      <td key={a.id} className="p-4 text-center font-semibold">{formatCurrency(a.estimated_rent_monthly)}</td>
                    ))}
                  </tr>
                  <tr className="border-b border-border/50 hover:bg-muted/50 bg-primary/5">
                    <td className="p-4 font-bold text-foreground">Yield Bruto</td>
                    {analyses.map((a) => (
                      <td key={a.id} className="p-4 text-center font-bold text-primary">
                        {formatPercent((a.metrics as any)?.gross_yield)}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-border/50 hover:bg-muted/50 bg-primary/5">
                    <td className="p-4 font-bold text-foreground">Yield Líquido</td>
                    {analyses.map((a) => (
                      <td key={a.id} className="p-4 text-center font-bold text-primary">
                        {formatPercent((a.metrics as any)?.net_yield)}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-border/50 hover:bg-muted/50">
                    <td className="p-4 font-medium text-muted-foreground">Cap Rate</td>
                    {analyses.map((a) => (
                      <td key={a.id} className="p-4 text-center font-semibold">
                        {formatPercent((a.metrics as any)?.cap_rate)}
                      </td>
                    ))}
                  </tr>
                  <tr className="hover:bg-muted/50">
                    <td className="p-4 font-medium text-muted-foreground">Payback (anos)</td>
                    {analyses.map((a) => (
                      <td key={a.id} className="p-4 text-center font-semibold">
                        {(a.metrics as any)?.payback_years?.toFixed(1) || "—"}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>

        {/* Mobile: Card Grid */}
        <div className="lg:hidden grid gap-4 md:grid-cols-2">
          {analyses.map((analysis) => {
            const address = analysis.address as any;
            const metrics = analysis.metrics as any;

            return (
              <Card key={analysis.id} className="border-border/50">
                <CardHeader>
                  <div className="space-y-2">
                    <CardTitle className="text-lg">{analysis.title}</CardTitle>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span>{address?.bairro}, {address?.cidade}</span>
                    </div>
                    <Badge className={getVerdictColor(analysis.verdict)}>
                      {getVerdictLabel(analysis.verdict)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Preço</span>
                      <span className="font-semibold">{formatCurrency(analysis.price)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Área</span>
                      <span className="font-semibold">{analysis.area_m2}m²</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Preço/m²</span>
                      <span className="font-semibold">{formatCurrency(Number(analysis.price) / Number(analysis.area_m2))}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Aluguel Est.</span>
                      <span className="font-semibold">{formatCurrency(analysis.estimated_rent_monthly)}</span>
                    </div>
                    <div className="pt-2 border-t border-border/50">
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">Yield Bruto</span>
                        <span className="font-bold text-primary">{formatPercent(metrics?.gross_yield)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Yield Líquido</span>
                        <span className="font-bold text-primary">{formatPercent(metrics?.net_yield)}</span>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-4"
                      onClick={() => navigate(`/analysis?id=${analysis.id}`)}
                    >
                      Ver Detalhes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

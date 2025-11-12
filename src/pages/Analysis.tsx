import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PropertySummary } from "@/components/PropertySummary";
import { InvestmentSnapshot } from "@/components/InvestmentSnapshot";
import { AssumptionsDrawer } from "@/components/AssumptionsDrawer";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, Share2 } from "lucide-react";
import { toast } from "sonner";

interface Analysis {
  id: string;
  title: string;
  address: any;
  price: number;
  area_m2: number;
  bedrooms?: number;
  estimated_market_value?: number;
  estimated_rent_monthly?: number;
  metrics: any;
  assumptions: any;
  verdict?: 'good' | 'fair' | 'overpriced';
}

const Analysis = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [assumptionsOpen, setAssumptionsOpen] = useState(false);

  const analysisId = searchParams.get('id');

  useEffect(() => {
    if (!analysisId) {
      navigate('/');
      return;
    }
    loadAnalysis();
  }, [analysisId]);

  const loadAnalysis = async () => {
    try {
      const { data, error } = await supabase
        .from('analyses')
        .select('*')
        .eq('id', analysisId)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        toast.error('Análise não encontrada');
        navigate('/');
        return;
      }

      setAnalysis(data as Analysis);
    } catch (error) {
      console.error('Error loading analysis:', error);
      toast.error('Erro ao carregar análise');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copiado!');
    } catch (error) {
      toast.error('Erro ao copiar link');
    }
  };

  const handleExportPDF = () => {
    toast.info('Exportação de PDF em desenvolvimento');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!analysis) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleShare}
                className="gap-2"
              >
                <Share2 className="h-4 w-4" />
                Compartilhar
              </Button>
              <Button
                onClick={handleExportPDF}
                className="gap-2 bg-gradient-brand"
              >
                <Download className="h-4 w-4" />
                Exportar PDF
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-6">
          <PropertySummary
            title={analysis.title}
            address={analysis.address}
            price={analysis.price}
            area={analysis.area_m2}
            bedrooms={analysis.bedrooms}
          />
          
          <InvestmentSnapshot
            estimatedValue={analysis.estimated_market_value}
            estimatedRent={analysis.estimated_rent_monthly}
            metrics={analysis.metrics}
            verdict={analysis.verdict}
            price={analysis.price}
            onAdjustAssumptions={() => setAssumptionsOpen(true)}
          />
        </div>
      </main>

      <AssumptionsDrawer
        open={assumptionsOpen}
        onOpenChange={setAssumptionsOpen}
        assumptions={analysis.assumptions}
        analysisId={analysis.id}
        onUpdate={loadAnalysis}
      />
    </div>
  );
};

export default Analysis;

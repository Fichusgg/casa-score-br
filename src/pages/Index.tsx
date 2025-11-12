import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { TrendingUp, Calculator, BarChart3 } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [url, setUrl] = useState("");
  
  // Manual input fields
  const [manualData, setManualData] = useState({
    title: "",
    price: "",
    area_m2: "",
    bairro: "",
    cidade: "São Paulo",
    estado: "SP",
    bedrooms: "",
  });

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) {
      toast.error("Cole o link do imóvel");
      return;
    }

    setLoading(true);
    try {
      // Call edge function to parse URL
      const { data, error } = await supabase.functions.invoke('parse-listing', {
        body: { url: url.trim() },
      });

      if (error) throw error;

      // Create analysis with parsed data
      const { data: analysis, error: analysisError } = await supabase
        .from('analyses')
        .insert({
          source_url: url,
          title: data.title,
          price: data.price,
          area_m2: data.area_m2,
          bedrooms: data.bedrooms,
          address: data.address,
        })
        .select()
        .single();

      if (analysisError) throw analysisError;

      // Calculate metrics
      await supabase.functions.invoke('calculate-metrics', {
        body: { analysisId: analysis.id },
      });

      navigate(`/analysis?id=${analysis.id}`);
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.message || 'Erro ao processar imóvel');
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!manualData.title || !manualData.price || !manualData.area_m2 || !manualData.bairro) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    setLoading(true);
    try {
      const { data: analysis, error } = await supabase
        .from('analyses')
        .insert({
          title: manualData.title,
          price: parseFloat(manualData.price),
          area_m2: parseFloat(manualData.area_m2),
          bedrooms: manualData.bedrooms ? parseInt(manualData.bedrooms) : null,
          address: {
            bairro: manualData.bairro,
            cidade: manualData.cidade,
            estado: manualData.estado,
          },
        })
        .select()
        .single();

      if (error) throw error;

      // Calculate metrics
      await supabase.functions.invoke('calculate-metrics', {
        body: { analysisId: analysis.id },
      });

      navigate(`/analysis?id=${analysis.id}`);
    } catch (error: any) {
      console.error('Error:', error);
      toast.error('Erro ao criar análise');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
              <span className="bg-gradient-brand bg-clip-text text-transparent">
                ImmoYield
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
              Descubra se um imóvel é um bom investimento em segundos
            </p>
          </div>

          {/* Main Input Card */}
          <Card className="shadow-card border-2">
            <CardContent className="pt-6">
              <Tabs defaultValue="url" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="url">Cole o Link</TabsTrigger>
                  <TabsTrigger value="manual">Insira Manualmente</TabsTrigger>
                </TabsList>

                <TabsContent value="url" className="space-y-4">
                  <form onSubmit={handleUrlSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="url">Link do Imóvel</Label>
                      <Input
                        id="url"
                        type="url"
                        placeholder="https://www.olx.com.br/..."
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        className="text-lg"
                      />
                      <p className="text-sm text-muted-foreground">
                        Suporta OLX, QuintoAndar, VivaReal, Loft
                      </p>
                    </div>

                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full h-12 text-lg bg-gradient-brand shadow-success"
                    >
                      {loading ? 'Analisando...' : 'Analisar Investimento'}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="manual" className="space-y-4">
                  <form onSubmit={handleManualSubmit} className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="title">Título *</Label>
                        <Input
                          id="title"
                          placeholder="Ex: Apartamento 2 quartos Pinheiros"
                          value={manualData.title}
                          onChange={(e) => setManualData({ ...manualData, title: e.target.value })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="price">Preço (R$) *</Label>
                        <Input
                          id="price"
                          type="number"
                          placeholder="850000"
                          value={manualData.price}
                          onChange={(e) => setManualData({ ...manualData, price: e.target.value })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="area">Área (m²) *</Label>
                        <Input
                          id="area"
                          type="number"
                          placeholder="75"
                          value={manualData.area_m2}
                          onChange={(e) => setManualData({ ...manualData, area_m2: e.target.value })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="bairro">Bairro *</Label>
                        <Input
                          id="bairro"
                          placeholder="Pinheiros"
                          value={manualData.bairro}
                          onChange={(e) => setManualData({ ...manualData, bairro: e.target.value })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="bedrooms">Quartos</Label>
                        <Input
                          id="bedrooms"
                          type="number"
                          placeholder="2"
                          value={manualData.bedrooms}
                          onChange={(e) => setManualData({ ...manualData, bedrooms: e.target.value })}
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full h-12 text-lg bg-gradient-brand shadow-success"
                    >
                      {loading ? 'Criando Análise...' : 'Criar Análise'}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6 pt-8">
            <Card className="p-6 text-center space-y-2">
              <TrendingUp className="h-8 w-8 mx-auto text-primary" />
              <h3 className="font-semibold">Análise Instantânea</h3>
              <p className="text-sm text-muted-foreground">
                Rentabilidade e indicadores em segundos
              </p>
            </Card>

            <Card className="p-6 text-center space-y-2">
              <Calculator className="h-8 w-8 mx-auto text-primary" />
              <h3 className="font-semibold">Cálculos Transparentes</h3>
              <p className="text-sm text-muted-foreground">
                Veja de onde vêm os números
              </p>
            </Card>

            <Card className="p-6 text-center space-y-2">
              <BarChart3 className="h-8 w-8 mx-auto text-primary" />
              <h3 className="font-semibold">Baseado em Dados Reais</h3>
              <p className="text-sm text-muted-foreground">
                Comparações com mercado local
              </p>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;

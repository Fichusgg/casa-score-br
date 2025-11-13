import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface CompSale {
  id: string;
  address: any;
  price: number;
  area_m2: number;
  price_per_m2: number;
  source?: string;
  captured_at: string;
}

interface CompRental {
  id: string;
  address: any;
  rent_monthly: number;
  area_m2: number;
  rent_per_m2: number;
  source?: string;
  captured_at: string;
}

interface ComparablesSectionProps {
  price: number;
  area: number;
  estimatedRent?: number;
  geo?: [number, number];
}

export const ComparablesSection = ({ price, area, estimatedRent, geo }: ComparablesSectionProps) => {
  const [sales, setSales] = useState<CompSale[]>([]);
  const [rentals, setRentals] = useState<CompRental[]>([]);
  const [loading, setLoading] = useState(true);

  const pricePerM2 = price / area;
  const rentPerM2 = estimatedRent ? estimatedRent / area : 0;

  useEffect(() => {
    loadComparables();
  }, []);

  const loadComparables = async () => {
    try {
      // Fetch comparable sales
      const { data: salesData, error: salesError } = await supabase
        .from('comps_sales')
        .select('*')
        .order('captured_at', { ascending: false })
        .limit(10);

      if (salesError) throw salesError;
      setSales(salesData || []);

      // Fetch comparable rentals
      const { data: rentalsData, error: rentalsError } = await supabase
        .from('comps_rentals')
        .select('*')
        .order('captured_at', { ascending: false })
        .limit(10);

      if (rentalsError) throw rentalsError;
      setRentals(rentalsData || []);
    } catch (error) {
      console.error('Error loading comparables:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getComparisonIcon = (compValue: number, subjectValue: number) => {
    const diff = ((compValue - subjectValue) / subjectValue) * 100;
    if (Math.abs(diff) < 5) return <Minus className="h-4 w-4 text-muted-foreground" />;
    if (diff > 0) return <TrendingUp className="h-4 w-4 text-destructive" />;
    return <TrendingDown className="h-4 w-4 text-green-600" />;
  };

  const getComparisonBadge = (compValue: number, subjectValue: number) => {
    const diff = ((compValue - subjectValue) / subjectValue) * 100;
    const diffStr = diff > 0 ? `+${diff.toFixed(1)}%` : `${diff.toFixed(1)}%`;
    
    if (Math.abs(diff) < 5) {
      return <Badge variant="secondary" className="gap-1">{diffStr}</Badge>;
    }
    if (diff > 0) {
      return <Badge variant="destructive" className="gap-1">{diffStr}</Badge>;
    }
    return <Badge className="gap-1 bg-green-600">{diffStr}</Badge>;
  };

  const formatAddress = (address: any) => {
    if (!address) return 'Endereço não disponível';
    const parts = [address.bairro, address.cidade].filter(Boolean);
    return parts.join(', ');
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Comparáveis Próximos</CardTitle>
          <CardDescription>Carregando dados de mercado...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Comparáveis de Mercado
        </CardTitle>
        <CardDescription>
          Compare este imóvel com propriedades similares na região
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="sales" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="sales">Vendas ({sales.length})</TabsTrigger>
            <TabsTrigger value="rentals">Aluguéis ({rentals.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="sales" className="mt-4">
            {sales.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum dado de venda disponível
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Localização</TableHead>
                      <TableHead className="text-right">Área (m²)</TableHead>
                      <TableHead className="text-right">Preço</TableHead>
                      <TableHead className="text-right">R$/m²</TableHead>
                      <TableHead className="text-right">vs. Este</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sales.map((sale) => (
                      <TableRow key={sale.id}>
                        <TableCell className="font-medium">
                          {formatAddress(sale.address)}
                        </TableCell>
                        <TableCell className="text-right">{sale.area_m2.toFixed(0)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(sale.price)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(sale.price_per_m2)}</TableCell>
                        <TableCell className="text-right">
                          {getComparisonBadge(sale.price_per_m2, pricePerM2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="rentals" className="mt-4">
            {rentals.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum dado de aluguel disponível
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Localização</TableHead>
                      <TableHead className="text-right">Área (m²)</TableHead>
                      <TableHead className="text-right">Aluguel</TableHead>
                      <TableHead className="text-right">R$/m²</TableHead>
                      <TableHead className="text-right">vs. Este</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rentals.map((rental) => (
                      <TableRow key={rental.id}>
                        <TableCell className="font-medium">
                          {formatAddress(rental.address)}
                        </TableCell>
                        <TableCell className="text-right">{rental.area_m2.toFixed(0)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(rental.rent_monthly)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(rental.rent_per_m2)}</TableCell>
                        <TableCell className="text-right">
                          {rentPerM2 > 0 ? getComparisonBadge(rental.rent_per_m2, rentPerM2) : <Badge variant="secondary">—</Badge>}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="mt-4 p-4 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong>Seu imóvel:</strong> {formatCurrency(pricePerM2)}/m² (venda)
            {rentPerM2 > 0 && ` • ${formatCurrency(rentPerM2)}/m² (aluguel estimado)`}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Os badges mostram a diferença percentual em relação ao seu imóvel. 
            Verde = mais barato que comparáveis, vermelho = mais caro.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

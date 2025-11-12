import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Home, Ruler } from "lucide-react";

interface PropertySummaryProps {
  title: string;
  address: any;
  price: number;
  area: number;
  bedrooms?: number;
}

export const PropertySummary = ({ title, address, price, area, bedrooms }: PropertySummaryProps) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const addressString = `${address.bairro}, ${address.cidade} - ${address.estado}`;

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">{title}</CardTitle>
        <div className="flex items-start gap-2 text-muted-foreground">
          <MapPin className="h-4 w-4 mt-1 flex-shrink-0" />
          <span className="text-sm">{addressString}</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Preço</p>
            <p className="text-2xl font-bold text-primary">{formatCurrency(price)}</p>
          </div>
          
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Preço/m²</p>
            <p className="text-xl font-semibold">{formatCurrency(price / area)}</p>
          </div>
        </div>

        <div className="flex gap-4 pt-2 border-t">
          <div className="flex items-center gap-2">
            <Ruler className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              <span className="font-semibold">{area.toFixed(0)}</span> m²
            </span>
          </div>
          
          {bedrooms && (
            <div className="flex items-center gap-2">
              <Home className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                <span className="font-semibold">{bedrooms}</span> {bedrooms === 1 ? 'quarto' : 'quartos'}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

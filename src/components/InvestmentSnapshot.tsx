import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface InvestmentSnapshotProps {
  estimatedValue?: number;
  estimatedRent?: number;
  metrics: any;
  verdict?: 'good' | 'fair' | 'overpriced';
  price: number;
  onAdjustAssumptions: () => void;
}

export const InvestmentSnapshot = ({
  estimatedValue,
  estimatedRent,
  metrics,
  verdict,
  price,
  onAdjustAssumptions,
}: InvestmentSnapshotProps) => {
  const formatCurrency = (value?: number) => {
    if (!value) return 'R$ --';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value?: number) => {
    if (!value) return '--';
    return `${value.toFixed(2)}%`;
  };

  const getVerdictConfig = () => {
    switch (verdict) {
      case 'good':
        return {
          label: 'Bom Investimento',
          icon: TrendingUp,
          className: 'bg-success text-success-foreground',
        };
      case 'fair':
        return {
          label: 'Investimento Justo',
          icon: Minus,
          className: 'bg-warning text-warning-foreground',
        };
      case 'overpriced':
        return {
          label: 'Sobrevalorizado',
          icon: TrendingDown,
          className: 'bg-danger text-danger-foreground',
        };
      default:
        return null;
    }
  };

  const verdictConfig = getVerdictConfig();
  const VerdictIcon = verdictConfig?.icon;

  const priceDelta = estimatedValue ? ((price - estimatedValue) / estimatedValue) * 100 : 0;

  return (
    <Card className="shadow-card">
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="text-2xl font-bold">Análise de Investimento</CardTitle>
          {verdictConfig && VerdictIcon && (
            <Badge className={verdictConfig.className}>
              <VerdictIcon className="h-3 w-3 mr-1" />
              {verdictConfig.label}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Estimated Values */}
        <div className="space-y-4">
          <div className="flex justify-between items-baseline border-b pb-2">
            <span className="text-sm text-muted-foreground">Valor de mercado estimado</span>
            <span className="text-lg font-semibold">{formatCurrency(estimatedValue)}</span>
          </div>
          
          {estimatedValue && (
            <div className="flex justify-between items-baseline border-b pb-2">
              <span className="text-sm text-muted-foreground">Preço vs. mercado</span>
              <span className={`text-lg font-semibold ${priceDelta > 0 ? 'text-danger' : 'text-success'}`}>
                {priceDelta > 0 ? '+' : ''}{priceDelta.toFixed(1)}%
              </span>
            </div>
          )}

          <div className="flex justify-between items-baseline border-b pb-2">
            <span className="text-sm text-muted-foreground">Aluguel mensal estimado</span>
            <span className="text-lg font-semibold">{formatCurrency(estimatedRent)}</span>
          </div>
        </div>

        {/* Metrics */}
        <div className="space-y-4 pt-4 border-t">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
            Indicadores
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Rentabilidade Bruta</p>
              <p className="text-2xl font-bold text-primary">{formatPercent(metrics.gross_yield)}</p>
            </div>
            
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Rentabilidade Líquida</p>
              <p className="text-2xl font-bold text-primary">{formatPercent(metrics.net_yield)}</p>
            </div>
            
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Cap Rate</p>
              <p className="text-xl font-semibold">{formatPercent(metrics.cap_rate)}</p>
            </div>
            
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Payback</p>
              <p className="text-xl font-semibold">
                {metrics.payback_years ? `${metrics.payback_years.toFixed(1)} anos` : '--'}
              </p>
            </div>
          </div>
        </div>

        <Button
          variant="outline"
          className="w-full gap-2"
          onClick={onAdjustAssumptions}
        >
          <Settings className="h-4 w-4" />
          Ajustar Premissas
        </Button>
      </CardContent>
    </Card>
  );
};

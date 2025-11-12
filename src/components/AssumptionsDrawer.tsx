import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AssumptionsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assumptions: any;
  analysisId: string;
  onUpdate: () => void;
}

export const AssumptionsDrawer = ({
  open,
  onOpenChange,
  assumptions,
  analysisId,
  onUpdate,
}: AssumptionsDrawerProps) => {
  const [values, setValues] = useState(assumptions || {});
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('analyses')
        .update({ assumptions: values })
        .eq('id', analysisId);

      if (error) throw error;

      // Recalculate metrics via edge function
      const { data, error: calcError } = await supabase.functions.invoke('calculate-metrics', {
        body: { analysisId },
      });

      if (calcError) throw calcError;

      toast.success('Premissas atualizadas!');
      onUpdate();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating assumptions:', error);
      toast.error('Erro ao atualizar premissas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Ajustar Premissas</SheetTitle>
          <SheetDescription>
            Personalize os valores para recalcular os indicadores
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-6">
          <div className="space-y-2">
            <Label htmlFor="iptu">IPTU (R$/mês)</Label>
            <Input
              id="iptu"
              type="number"
              value={values.iptu || 0}
              onChange={(e) => setValues({ ...values, iptu: parseFloat(e.target.value) || 0 })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="condominio">Condomínio (R$/mês)</Label>
            <Input
              id="condominio"
              type="number"
              value={values.condominio || 0}
              onChange={(e) => setValues({ ...values, condominio: parseFloat(e.target.value) || 0 })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="itbi_pct">ITBI (%)</Label>
            <Input
              id="itbi_pct"
              type="number"
              step="0.1"
              value={values.itbi_pct || 3}
              onChange={(e) => setValues({ ...values, itbi_pct: parseFloat(e.target.value) || 3 })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="taxes_fixed">Taxas e Registros (R$)</Label>
            <Input
              id="taxes_fixed"
              type="number"
              value={values.taxes_fixed || 0}
              onChange={(e) => setValues({ ...values, taxes_fixed: parseFloat(e.target.value) || 0 })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="vacancy_pct">Vacância (%)</Label>
            <Input
              id="vacancy_pct"
              type="number"
              step="0.1"
              value={values.vacancy_pct || 5}
              onChange={(e) => setValues({ ...values, vacancy_pct: parseFloat(e.target.value) || 5 })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="maint_pct">Manutenção (% do aluguel)</Label>
            <Input
              id="maint_pct"
              type="number"
              step="0.1"
              value={values.maint_pct || 5}
              onChange={(e) => setValues({ ...values, maint_pct: parseFloat(e.target.value) || 5 })}
            />
          </div>

          <Button
            onClick={handleUpdate}
            disabled={loading}
            className="w-full bg-gradient-brand"
          >
            {loading ? 'Atualizando...' : 'Recalcular'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

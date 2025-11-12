import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { analysisId } = await req.json();

    if (!analysisId) {
      throw new Error('Analysis ID is required');
    }

    console.log('Calculating metrics for analysis:', analysisId);

    // Fetch the analysis
    const { data: analysis, error: fetchError } = await supabaseClient
      .from('analyses')
      .select('*')
      .eq('id', analysisId)
      .single();

    if (fetchError) throw fetchError;

    // Fetch comparable sales for market value estimation
    const { data: salesComps } = await supabaseClient
      .from('comps_sales')
      .select('price_per_m2')
      .limit(10);

    // Fetch comparable rentals for rent estimation
    const { data: rentalComps } = await supabaseClient
      .from('comps_rentals')
      .select('rent_per_m2')
      .limit(10);

    // Calculate average price per m² from comps
    const avgPricePerM2 = salesComps?.length
      ? salesComps.reduce((sum, comp) => sum + comp.price_per_m2, 0) / salesComps.length
      : analysis.price / analysis.area_m2;

    // Calculate average rent per m² from comps
    const avgRentPerM2 = rentalComps?.length
      ? rentalComps.reduce((sum, comp) => sum + comp.rent_per_m2, 0) / rentalComps.length
      : avgPricePerM2 * 0.006; // Fallback: 0.6% rental yield rule of thumb

    const estimatedMarketValue = avgPricePerM2 * analysis.area_m2;
    const estimatedRentMonthly = avgRentPerM2 * analysis.area_m2;

    // Get assumptions or use defaults
    const assumptions = analysis.assumptions || {
      iptu: 0,
      condominio: 0,
      itbi_pct: 3,
      taxes_fixed: 0,
      vacancy_pct: 5,
      maint_pct: 5,
    };

    // Calculate metrics
    const annualRent = estimatedRentMonthly * 12;
    const grossYield = (annualRent / analysis.price) * 100;

    const itbi = (analysis.price * assumptions.itbi_pct) / 100;
    const totalInvestment = analysis.price + itbi + assumptions.taxes_fixed;

    const annualCosts =
      (assumptions.iptu * 12) +
      (assumptions.condominio * 12) +
      (estimatedRentMonthly * 12 * assumptions.vacancy_pct / 100) +
      (estimatedRentMonthly * 12 * assumptions.maint_pct / 100);

    const netAnnualIncome = annualRent - annualCosts;
    const netYield = (netAnnualIncome / totalInvestment) * 100;
    const capRate = (netAnnualIncome / analysis.price) * 100;
    const paybackYears = netYield > 0 ? 100 / netYield : null;

    // Determine verdict
    let verdict: 'good' | 'fair' | 'overpriced';
    if (netYield >= 7.0) {
      verdict = 'good';
    } else if (netYield >= 5.0) {
      verdict = 'fair';
    } else {
      verdict = 'overpriced';
    }

    const metrics = {
      gross_yield: grossYield,
      net_yield: netYield,
      cap_rate: capRate,
      payback_years: paybackYears,
      annual_rent: annualRent,
      annual_costs: annualCosts,
      net_annual_income: netAnnualIncome,
    };

    console.log('Calculated metrics:', metrics);
    console.log('Verdict:', verdict);

    // Update the analysis with estimates, metrics, and verdict
    const { error: updateError } = await supabaseClient
      .from('analyses')
      .update({
        estimated_market_value: estimatedMarketValue,
        estimated_rent_monthly: estimatedRentMonthly,
        metrics,
        verdict,
      })
      .eq('id', analysisId);

    if (updateError) throw updateError;

    return new Response(
      JSON.stringify({ success: true, metrics, verdict }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error calculating metrics:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

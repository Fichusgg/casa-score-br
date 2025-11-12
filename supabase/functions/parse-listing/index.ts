import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url) {
      throw new Error('URL is required');
    }

    console.log('Parsing listing URL:', url);

    // For MVP, we'll return mock data
    // In production, this would scrape the actual listing
    const mockData = {
      title: 'Apartamento 2 Quartos - Pinheiros',
      price: 850000,
      area_m2: 75,
      bedrooms: 2,
      address: {
        street: 'Rua dos Pinheiros',
        bairro: 'Pinheiros',
        cidade: 'São Paulo',
        estado: 'SP',
        cep: '05422-010',
      },
    };

    console.log('Parsed data:', mockData);

    return new Response(
      JSON.stringify(mockData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error parsing listing:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

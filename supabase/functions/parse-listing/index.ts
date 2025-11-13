import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { DOMParser, Element } from "https://deno.land/x/deno_dom@v0.1.43/deno-dom-wasm.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PropertyData {
  title: string;
  price: number;
  area_m2: number;
  bedrooms?: number;
  address: {
    street?: string;
    bairro: string;
    cidade: string;
    estado: string;
    cep?: string;
  };
}

function detectPlatform(url: string): string {
  if (url.includes('olx.com.br')) return 'olx';
  if (url.includes('quintoandar.com.br')) return 'quintoandar';
  if (url.includes('vivareal.com.br')) return 'vivareal';
  if (url.includes('loft.com.br')) return 'loft';
  throw new Error('Unsupported platform. Supported: OLX, QuintoAndar, VivaReal, Loft');
}

function scrapeOLX(document: any): PropertyData {
  console.log('Scraping OLX listing...');
  
  const titleEl = document.querySelector('h1[data-ds-component="DS-Text"]') || 
                  document.querySelector('h1.sc-45jt43-0') ||
                  document.querySelector('h1');
  const title = titleEl?.textContent?.trim() || 'Imóvel OLX';
  
  const priceEl = document.querySelector('[data-ds-component="DS-Text"][class*="olx-text"]');
  const priceText = priceEl?.textContent?.replace(/[^\d]/g, '') || '0';
  const price = parseInt(priceText) || 0;
  
  const allText = document.body?.textContent || '';
  
  const areaMatch = allText.match(/(\d+)\s*m[²2]/i);
  const area_m2 = areaMatch ? parseInt(areaMatch[1]) : 75;
  
  const bedroomsMatch = allText.match(/(\d+)\s*quarto/i);
  const bedrooms = bedroomsMatch ? parseInt(bedroomsMatch[1]) : undefined;
  
  const addressEl = document.querySelector('[data-ds-component="DS-Text"][class*="olx-text--body"]');
  const addressText = addressEl?.textContent?.trim() || '';
  const addressParts = addressText.split(',').map((s: string) => s.trim());
  
  return {
    title,
    price,
    area_m2,
    bedrooms,
    address: {
      bairro: addressParts[0] || 'Centro',
      cidade: addressParts[1] || 'São Paulo',
      estado: 'SP',
    },
  };
}

function scrapeQuintoAndar(document: any): PropertyData {
  console.log('Scraping QuintoAndar listing...');
  
  const titleEl = document.querySelector('h1');
  const title = titleEl?.textContent?.trim() || 'Imóvel QuintoAndar';
  
  const priceEl = document.querySelector('[data-testid="price"]') || 
                  document.querySelector('.price');
  const priceText = priceEl?.textContent?.replace(/[^\d]/g, '') || '0';
  const price = parseInt(priceText) || 0;
  
  const areaEl = document.querySelector('[data-testid="area"]');
  const area_m2 = areaEl ? parseInt(areaEl.textContent?.replace(/[^\d]/g, '') || '0') : 75;
  
  const bedroomsEl = document.querySelector('[data-testid="bedrooms"]');
  const bedrooms = bedroomsEl ? parseInt(bedroomsEl.textContent?.replace(/[^\d]/g, '') || '0') : undefined;
  
  const addressEl = document.querySelector('[data-testid="address"]') ||
                    document.querySelector('.address');
  const addressText = addressEl?.textContent?.trim() || '';
  const addressParts = addressText.split(',').map((s: string) => s.trim());
  
  return {
    title,
    price,
    area_m2,
    bedrooms,
    address: {
      bairro: addressParts[0] || 'Centro',
      cidade: addressParts[1] || 'São Paulo',
      estado: 'SP',
    },
  };
}

function scrapeVivaReal(document: any): PropertyData {
  console.log('Scraping VivaReal listing...');
  
  const titleEl = document.querySelector('h1.title') || 
                  document.querySelector('h1[class*="title"]') ||
                  document.querySelector('h1');
  const title = titleEl?.textContent?.trim() || 'Imóvel VivaReal';
  
  const priceEl = document.querySelector('[itemprop="price"]') ||
                  document.querySelector('.price');
  const priceText = priceEl?.getAttribute('content') || 
                    priceEl?.textContent?.replace(/[^\d]/g, '') || '0';
  const price = parseInt(priceText) || 0;
  
  const areaEl = document.querySelector('[itemprop="floorSize"]');
  let area_m2 = 0;
  if (areaEl) {
    area_m2 = parseInt(areaEl.getAttribute('content') || areaEl.textContent?.replace(/[^\d]/g, '') || '0');
  } else {
    const featureItems = Array.from(document.querySelectorAll('.features__item'));
    const areaItem = featureItems.find((el: any) => el.textContent?.includes('m²')) as Element | undefined;
    area_m2 = areaItem ? parseInt((areaItem as any).textContent?.replace(/[^\d]/g, '') || '0') : 75;
  }
  
  const bedroomsEl = document.querySelector('[itemprop="numberOfRooms"]');
  let bedrooms: number | undefined = undefined;
  if (bedroomsEl) {
    bedrooms = parseInt(bedroomsEl.getAttribute('content') || bedroomsEl.textContent?.replace(/[^\d]/g, '') || '0');
  } else {
    const featureItems = Array.from(document.querySelectorAll('.features__item'));
    const bedroomItem = featureItems.find((el: any) => el.textContent?.includes('quarto')) as Element | undefined;
    bedrooms = bedroomItem ? parseInt((bedroomItem as any).textContent?.replace(/[^\d]/g, '') || '0') : undefined;
  }
  
  const addressEl = document.querySelector('[itemprop="address"]') ||
                    document.querySelector('.location');
  const addressText = addressEl?.textContent?.trim() || '';
  const addressParts = addressText.split(',').map((s: string) => s.trim());
  
  return {
    title,
    price,
    area_m2,
    bedrooms,
    address: {
      bairro: addressParts[0] || 'Centro',
      cidade: addressParts[1] || 'São Paulo',
      estado: 'SP',
    },
  };
}

async function scrapeListing(url: string): Promise<PropertyData> {
  const platform = detectPlatform(url);
  console.log(`Detected platform: ${platform}`);
  
  console.log(`Fetching page: ${url}`);
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'max-age=0',
        'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1',
      },
    });
    
    if (!response.ok) {
      console.warn(`Scraping blocked: ${response.status} ${response.statusText}`);
      // Return partial data that will trigger manual input with platform info
      throw new Error(`BLOCKED:${platform}`);
    }
    
    const html = await response.text();
    const document = new DOMParser().parseFromString(html, 'text/html');
    
    if (!document) {
      throw new Error('Failed to parse HTML');
    }
    
    let data: PropertyData;
    
    switch (platform) {
      case 'olx':
        data = scrapeOLX(document);
        break;
      case 'quintoandar':
        data = scrapeQuintoAndar(document);
        break;
      case 'vivareal':
      case 'loft':
        data = scrapeVivaReal(document);
        break;
      default:
        throw new Error('Unsupported platform');
    }
    
    console.log('Scraped data:', data);
    return data;
    
  } catch (error) {
    // If blocked, return helpful error for frontend to handle
    if (error instanceof Error && error.message.startsWith('BLOCKED:')) {
      throw error;
    }
    // Other errors also get thrown
    throw error;
  }
}

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

    const data = await scrapeListing(url);

    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error parsing listing:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // If blocked by anti-bot, return a specific error code
    if (errorMessage.startsWith('BLOCKED:')) {
      const platform = errorMessage.split(':')[1];
      return new Response(
        JSON.stringify({ 
          error: 'SCRAPING_BLOCKED',
          message: `${platform} bloqueou a extração automática. Por favor, insira os dados manualmente.`,
          platform 
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

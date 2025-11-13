import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import puppeteer from "https://deno.land/x/puppeteer@16.2.0/mod.ts";

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

async function scrapeOLX(page: any): Promise<PropertyData> {
  console.log('Scraping OLX listing...');
  
  const title = await page.$eval('h1[data-ds-component="DS-Text"]', (el: any) => el.textContent.trim()).catch(() => 
    page.$eval('h1.sc-45jt43-0', (el: any) => el.textContent.trim())
  );
  
  const priceText = await page.$eval('[data-ds-component="DS-Text"][class*="olx-text"]', (el: any) => 
    el.textContent.replace(/[^\d]/g, '')
  ).catch(() => '0');
  const price = parseInt(priceText) || 0;
  
  const detailsText = await page.$$eval('[data-ds-component="DS-Text"]', (els: any[]) => 
    els.map(el => el.textContent).join(' ')
  );
  
  const areaMatch = detailsText.match(/(\d+)\s*m[²2]/i);
  const area_m2 = areaMatch ? parseInt(areaMatch[1]) : 0;
  
  const bedroomsMatch = detailsText.match(/(\d+)\s*quarto/i);
  const bedrooms = bedroomsMatch ? parseInt(bedroomsMatch[1]) : undefined;
  
  const addressText = await page.$eval('[data-ds-component="DS-Text"][class*="olx-text--body"]', (el: any) => 
    el.textContent.trim()
  ).catch(() => '');
  
  const addressParts = addressText.split(',').map((s: string) => s.trim());
  
  return {
    title,
    price,
    area_m2,
    bedrooms,
    address: {
      bairro: addressParts[0] || 'N/A',
      cidade: addressParts[1] || 'São Paulo',
      estado: 'SP',
    },
  };
}

async function scrapeQuintoAndar(page: any): Promise<PropertyData> {
  console.log('Scraping QuintoAndar listing...');
  
  const title = await page.$eval('h1', (el: any) => el.textContent.trim());
  
  const priceText = await page.$eval('[data-testid="price"]', (el: any) => 
    el.textContent.replace(/[^\d]/g, '')
  ).catch(() => 
    page.$eval('.price', (el: any) => el.textContent.replace(/[^\d]/g, ''))
  );
  const price = parseInt(priceText) || 0;
  
  const area_m2 = await page.$eval('[data-testid="area"]', (el: any) => 
    parseInt(el.textContent.replace(/[^\d]/g, ''))
  ).catch(() => 0);
  
  const bedrooms = await page.$eval('[data-testid="bedrooms"]', (el: any) => 
    parseInt(el.textContent.replace(/[^\d]/g, ''))
  ).catch(() => undefined);
  
  const addressText = await page.$eval('[data-testid="address"]', (el: any) => 
    el.textContent.trim()
  ).catch(() => 
    page.$eval('.address', (el: any) => el.textContent.trim())
  );
  
  const addressParts = addressText.split(',').map((s: string) => s.trim());
  
  return {
    title,
    price,
    area_m2,
    bedrooms,
    address: {
      bairro: addressParts[0] || 'N/A',
      cidade: addressParts[1] || 'São Paulo',
      estado: 'SP',
    },
  };
}

async function scrapeVivaReal(page: any): Promise<PropertyData> {
  console.log('Scraping VivaReal listing...');
  
  const title = await page.$eval('h1.title', (el: any) => el.textContent.trim()).catch(() =>
    page.$eval('h1[class*="title"]', (el: any) => el.textContent.trim())
  );
  
  const priceText = await page.$eval('[itemprop="price"]', (el: any) => 
    el.getAttribute('content') || el.textContent.replace(/[^\d]/g, '')
  ).catch(() =>
    page.$eval('.price', (el: any) => el.textContent.replace(/[^\d]/g, ''))
  );
  const price = parseInt(priceText) || 0;
  
  const area_m2 = await page.$eval('[itemprop="floorSize"]', (el: any) => 
    parseInt(el.getAttribute('content') || el.textContent.replace(/[^\d]/g, ''))
  ).catch(() => 
    page.$$eval('.features__item', (els: any[]) => {
      const areaEl = els.find(el => el.textContent.includes('m²'));
      return areaEl ? parseInt(areaEl.textContent.replace(/[^\d]/g, '')) : 0;
    })
  );
  
  const bedrooms = await page.$eval('[itemprop="numberOfRooms"]', (el: any) => 
    parseInt(el.getAttribute('content') || el.textContent.replace(/[^\d]/g, ''))
  ).catch(() => 
    page.$$eval('.features__item', (els: any[]) => {
      const bedroomEl = els.find(el => el.textContent.includes('quarto'));
      return bedroomEl ? parseInt(bedroomEl.textContent.replace(/[^\d]/g, '')) : undefined;
    })
  );
  
  const addressText = await page.$eval('[itemprop="address"]', (el: any) => 
    el.textContent.trim()
  ).catch(() =>
    page.$eval('.location', (el: any) => el.textContent.trim())
  );
  
  const addressParts = addressText.split(',').map((s: string) => s.trim());
  
  return {
    title,
    price,
    area_m2,
    bedrooms,
    address: {
      bairro: addressParts[0] || 'N/A',
      cidade: addressParts[1] || 'São Paulo',
      estado: 'SP',
    },
  };
}

async function scrapeListing(url: string): Promise<PropertyData> {
  const platform = detectPlatform(url);
  console.log(`Detected platform: ${platform}`);
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  
  try {
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    console.log(`Loading page: ${url}`);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    
    let data: PropertyData;
    
    switch (platform) {
      case 'olx':
        data = await scrapeOLX(page);
        break;
      case 'quintoandar':
        data = await scrapeQuintoAndar(page);
        break;
      case 'vivareal':
        data = await scrapeVivaReal(page);
        break;
      case 'loft':
        // Loft uses similar structure to VivaReal
        data = await scrapeVivaReal(page);
        break;
      default:
        throw new Error('Unsupported platform');
    }
    
    console.log('Scraped data:', data);
    return data;
    
  } finally {
    await browser.close();
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
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

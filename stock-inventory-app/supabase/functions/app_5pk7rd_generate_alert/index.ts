import { createClient } from 'npm:@supabase/supabase-js@2';

// Define the response type
interface ResponseData {
  status: string;
  message: string;
  alerts_generated?: number;
}

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Generate a request ID for logging
const requestId = crypto.randomUUID();

Deno.serve(async (req) => {
  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': '*',
      },
    });
  }
  
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ 
      status: 'error', 
      message: 'Only POST requests are allowed' 
    }), {
      status: 405,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
  
  console.log(`[${requestId}] Starting alert generation process`);
  
  try {
    const alertsGenerated: number = await generateAlerts();
    
    const responseData: ResponseData = {
      status: 'success',
      message: `Successfully generated ${alertsGenerated} alerts`,
      alerts_generated: alertsGenerated
    };
    
    console.log(`[${requestId}] Alert generation completed: ${responseData.message}`);
    
    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error(`[${requestId}] Error generating alerts:`, error);
    
    return new Response(JSON.stringify({ 
      status: 'error', 
      message: `Failed to generate alerts: ${error.message}` 
    }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
});

async function generateAlerts(): Promise<number> {
  let alertsGenerated = 0;
  
  // Check for expiring batches
  const today = new Date();
  const thirtyDaysLater = new Date(today);
  thirtyDaysLater.setDate(today.getDate() + 30);
  
  const { data: expiringBatches, error: expiringError } = await supabase
    .from('app_5pk7rd_batches')
    .select('id, product_id, batch_number, expiry_date, quantity')
    .gt('expiry_date', today.toISOString())
    .lt('expiry_date', thirtyDaysLater.toISOString())
    .gt('quantity', 0);
    
  if (expiringError) {
    throw new Error(`Error fetching expiring batches: ${expiringError.message}`);
  }
  
  console.log(`[${requestId}] Found ${expiringBatches?.length || 0} expiring batches`);
  
  // For each expiring batch, create an alert if one doesn't already exist
  for (const batch of expiringBatches || []) {
    // Get product details
    const { data: product, error: productError } = await supabase
      .from('app_5pk7rd_products')
      .select('name, sku')
      .eq('id', batch.product_id)
      .single();
      
    if (productError) {
      console.error(`[${requestId}] Error getting product details for batch ${batch.id}:`, productError);
      continue;
    }
    
    // Check if an alert already exists for this batch
    const { data: existingAlerts, error: existingError } = await supabase
      .from('app_5pk7rd_alerts')
      .select('id')
      .eq('related_id', batch.id)
      .eq('alert_type', 'expiry')
      .eq('resolved', false);
      
    if (existingError) {
      console.error(`[${requestId}] Error checking existing alerts for batch ${batch.id}:`, existingError);
      continue;
    }
    
    // If no alert exists, create one
    if (!existingAlerts?.length) {
      const daysUntilExpiry = Math.ceil((new Date(batch.expiry_date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      const { error: insertError } = await supabase
        .from('app_5pk7rd_alerts')
        .insert([{
          alert_type: 'expiry',
          alert_level: daysUntilExpiry <= 7 ? 'high' : 'medium',
          message: `Batch ${batch.batch_number} of ${product.name} (${product.sku}) will expire in ${daysUntilExpiry} days`,
          related_id: batch.id,
          related_type: 'batch',
          resolved: false,
          created_at: new Date().toISOString()
        }]);
        
      if (insertError) {
        console.error(`[${requestId}] Error creating alert for batch ${batch.id}:`, insertError);
        continue;
      }
      
      alertsGenerated++;
    }
  }
  
  // Check for low stock products
  const { data: lowStockProducts, error: lowStockError } = await supabase
    .from('app_5pk7rd_products')
    .select('*')
    .lt('total_stock', supabase.raw('reorder_point'));
    
  if (lowStockError) {
    throw new Error(`Error fetching low stock products: ${lowStockError.message}`);
  }
  
  console.log(`[${requestId}] Found ${lowStockProducts?.length || 0} low stock products`);
  
  // For each low stock product, create an alert if one doesn't already exist
  for (const product of lowStockProducts || []) {
    // Check if an alert already exists for this product
    const { data: existingAlerts, error: existingError } = await supabase
      .from('app_5pk7rd_alerts')
      .select('id')
      .eq('related_id', product.id)
      .eq('alert_type', 'stock')
      .eq('resolved', false);
      
    if (existingError) {
      console.error(`[${requestId}] Error checking existing alerts for product ${product.id}:`, existingError);
      continue;
    }
    
    // If no alert exists, create one
    if (!existingAlerts?.length) {
      const { error: insertError } = await supabase
        .from('app_5pk7rd_alerts')
        .insert([{
          alert_type: 'stock',
          alert_level: product.total_stock <= 0 ? 'high' : 'medium',
          message: `${product.name} (${product.sku}) is below reorder point. Current stock: ${product.total_stock}, Reorder point: ${product.reorder_point}`,
          related_id: product.id,
          related_type: 'product',
          resolved: false,
          created_at: new Date().toISOString()
        }]);
        
      if (insertError) {
        console.error(`[${requestId}] Error creating alert for product ${product.id}:`, insertError);
        continue;
      }
      
      alertsGenerated++;
    }
  }
  
  return alertsGenerated;
}
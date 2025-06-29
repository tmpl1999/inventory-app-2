import { createClient } from 'npm:@supabase/supabase-js@2';

// Define the response type
interface ResponseData {
  status: string;
  message: string;
  products_checked?: number;
  low_stock_products?: number;
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
  
  console.log(`[${requestId}] Starting stock level check process`);
  
  try {
    const result = await checkStockLevels();
    
    const responseData: ResponseData = {
      status: 'success',
      message: `Successfully checked ${result.productsChecked} products, found ${result.lowStockProducts} low stock products`,
      products_checked: result.productsChecked,
      low_stock_products: result.lowStockProducts
    };
    
    console.log(`[${requestId}] Stock level check completed: ${responseData.message}`);
    
    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error(`[${requestId}] Error checking stock levels:`, error);
    
    return new Response(JSON.stringify({ 
      status: 'error', 
      message: `Failed to check stock levels: ${error.message}` 
    }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
});

async function checkStockLevels(): Promise<{ productsChecked: number; lowStockProducts: number }> {
  // Get all products
  const { data: products, error } = await supabase
    .from('app_5pk7rd_products')
    .select('*');
    
  if (error) {
    throw new Error(`Error fetching products: ${error.message}`);
  }
  
  console.log(`[${requestId}] Checking stock for ${products?.length || 0} products`);
  
  // Calculate total stock for each product by summing batches
  let lowStockCount = 0;
  
  for (const product of products || []) {
    // Sum batch quantities for each product
    const { data: batches, error: batchError } = await supabase
      .from('app_5pk7rd_batches')
      .select('quantity')
      .eq('product_id', product.id);
      
    if (batchError) {
      console.error(`[${requestId}] Error fetching batches for product ${product.id}:`, batchError);
      continue;
    }
    
    const totalStock = batches?.reduce((sum, batch) => sum + (batch.quantity || 0), 0) || 0;
    
    // Update product total_stock
    const { error: updateError } = await supabase
      .from('app_5pk7rd_products')
      .update({ total_stock: totalStock })
      .eq('id', product.id);
      
    if (updateError) {
      console.error(`[${requestId}] Error updating stock for product ${product.id}:`, updateError);
      continue;
    }
    
    // Check if product is low on stock
    if (totalStock < product.reorder_point) {
      lowStockCount++;
      
      // Check if an alert already exists
      const { data: existingAlerts, error: alertError } = await supabase
        .from('app_5pk7rd_alerts')
        .select('id')
        .eq('related_id', product.id)
        .eq('alert_type', 'stock')
        .eq('resolved', false);
        
      if (alertError) {
        console.error(`[${requestId}] Error checking existing alerts for product ${product.id}:`, alertError);
        continue;
      }
      
      // If no alert exists, create one
      if (!existingAlerts?.length) {
        const { error: insertError } = await supabase
          .from('app_5pk7rd_alerts')
          .insert([{
            alert_type: 'stock',
            alert_level: totalStock <= 0 ? 'high' : 'medium',
            message: `${product.name} (${product.sku}) is below reorder point. Current stock: ${totalStock}, Reorder point: ${product.reorder_point}`,
            related_id: product.id,
            related_type: 'product',
            resolved: false,
            created_at: new Date().toISOString()
          }]);
          
        if (insertError) {
          console.error(`[${requestId}] Error creating alert for product ${product.id}:`, insertError);
        }
      }
    }
  }
  
  return {
    productsChecked: products?.length || 0,
    lowStockProducts: lowStockCount
  };
}
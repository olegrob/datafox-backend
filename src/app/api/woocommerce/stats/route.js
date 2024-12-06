import WooCommerceRestApi from "@woocommerce/woocommerce-rest-api";

const api = new WooCommerceRestApi({
  url: "https://datafox.ee",
  consumerKey: "ck_901d1f22aa07756dd24e7840daece07ea6addd48",
  consumerSecret: "cs_09c7740812df3f4074c903a591dbf22c2d42c033",
  version: "wc/v3"
});

export async function GET() {
  try {
    console.log('Fetching WooCommerce data...');
    
    // Get current date and last year dates
    const now = new Date();
    const currentPeriodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastYearStart = new Date(now.getFullYear() - 1, now.getMonth(), 1);

    // Fetch orders in parallel
    const [currentOrders, lastYearOrders] = await Promise.all([
      api.get("orders", {
        after: currentPeriodStart.toISOString(),
        per_page: 100,
        status: ["completed", "processing"]
      }),
      api.get("orders", {
        after: lastYearStart.toISOString(),
        before: new Date(lastYearStart.getFullYear(), lastYearStart.getMonth() + 1, 1).toISOString(),
        per_page: 100,
        status: ["completed", "processing"]
      })
    ]).catch(error => {
      console.error('WooCommerce API Error:', error.response?.data || error);
      throw error;
    });

    console.log('Current orders:', currentOrders.data.length);
    console.log('Last year orders:', lastYearOrders.data.length);

    // Calculate stats
    const currentStats = calculatePeriodStats(currentOrders.data);
    const lastYearStats = calculatePeriodStats(lastYearOrders.data);

    const stats = {
      orders: currentStats.orders,
      revenue: currentStats.revenue,
      averagePrice: currentStats.averagePrice,
      productsSold: currentStats.productsSold,
      
      ordersChange: calculatePercentageChange(currentStats.orders, lastYearStats.orders),
      revenueChange: calculatePercentageChange(currentStats.revenue, lastYearStats.revenue),
      averagePriceChange: calculatePercentageChange(currentStats.averagePrice, lastYearStats.averagePrice),
      productsSoldYearChange: calculatePercentageChange(currentStats.productsSold, lastYearStats.productsSold),

      recentOrders: currentOrders.data.slice(0, 10).map(order => ({
        product: order.line_items[0]?.name || 'Unknown Product',
        customer: `${order.billing.first_name} ${order.billing.last_name}`,
        category: order.line_items[0]?.categories?.[0]?.name || 'Uncategorized',
        amount: order.total
      })),

      recentTransactions: currentOrders.data.slice(0, 10).map(order => ({
        id: order.number,
        date: new Date(order.date_created).toLocaleDateString(),
        amount: order.total,
        cardType: order.payment_method_title,
        customer: `${order.billing.first_name} ${order.billing.last_name}`
      })),

      lastUpdated: new Date().toISOString()
    };

    return Response.json(stats);
  } catch (error) {
    console.error('API Route Error:', error);
    return Response.json({ 
      error: 'Failed to fetch WooCommerce data',
      details: error.message 
    }, { status: 500 });
  }
}

function calculatePeriodStats(orders) {
  const stats = orders.reduce((acc, order) => {
    const orderTotal = parseFloat(order.total);
    const productCount = order.line_items.reduce((sum, item) => sum + item.quantity, 0);
    
    acc.orders++;
    acc.revenue += orderTotal;
    acc.productsSold += productCount;
    
    return acc;
  }, {
    orders: 0,
    revenue: 0,
    productsSold: 0
  });

  stats.averagePrice = stats.revenue / stats.productsSold || 0;
  
  // Format numbers
  stats.revenue = parseFloat(stats.revenue.toFixed(2));
  stats.averagePrice = parseFloat(stats.averagePrice.toFixed(2));

  return stats;
}

function calculatePercentageChange(current, previous) {
  if (!previous) return 0;
  return parseFloat(((current - previous) / previous * 100).toFixed(1));
} 
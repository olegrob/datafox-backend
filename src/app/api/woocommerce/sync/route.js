import { NextResponse } from 'next/server';
import { woocommerceDb } from '@/lib/woocommerceDb';
import WooCommerceRestApi from '@woocommerce/woocommerce-rest-api';

const api = new WooCommerceRestApi({
  url: "https://datafox.ee",
  consumerKey: "ck_901d1f22aa07756dd24e7840daece07ea6addd48",
  consumerSecret: "cs_09c7740812df3f4074c903a591dbf22c2d42c033",
  version: "wc/v3"
});

async function fetchOrdersForPeriod(startDate, endDate) {
  const orders = await api.get("orders", {
    after: startDate.toISOString(),
    before: endDate ? endDate.toISOString() : undefined,
    status: ["completed", "processing"],
    per_page: 100,
    orderby: 'date',
    order: 'desc'
  });

  return orders.data;
}

function calculateStats(orders) {
  const stats = orders.reduce((acc, order) => {
    const orderTotal = parseFloat(order.total);
    const productCount = order.line_items.reduce((sum, item) => sum + item.quantity, 0);
    
    acc.orders++;
    acc.revenue += orderTotal;
    acc.productsSold += productCount;
    acc.totalItems += order.line_items.length;
    
    return acc;
  }, {
    orders: 0,
    revenue: 0,
    productsSold: 0,
    totalItems: 0
  });

  // Calculate averages
  stats.averageOrderValue = stats.orders > 0 ? stats.revenue / stats.orders : 0;
  stats.averageItemsPerOrder = stats.orders > 0 ? stats.totalItems / stats.orders : 0;
  
  // Format numbers to 2 decimal places
  stats.revenue = parseFloat(stats.revenue.toFixed(2));
  stats.averageOrderValue = parseFloat(stats.averageOrderValue.toFixed(2));
  stats.averageItemsPerOrder = parseFloat(stats.averageItemsPerOrder.toFixed(2));

  console.log('Calculated stats:', {
    orders: stats.orders,
    revenue: stats.revenue,
    averageOrderValue: stats.averageOrderValue,
    productsSold: stats.productsSold
  });

  return stats;
}

export async function POST(request) {
  try {
    console.log('Manual sync triggered...');
    
    const { period = '90' } = await request.json().catch(() => ({}));
    const periodDays = parseInt(period);

    try {
      // Get existing stats for this period
      const existingStats = await woocommerceDb.get(
        'SELECT * FROM woocommerce_stats WHERE period = ? ORDER BY created_at DESC LIMIT 1',
        [periodDays]
      );

      // Fetch WooCommerce data
      const now = new Date();
      const periodStart = new Date(now);
      periodStart.setDate(now.getDate() - periodDays);
      
      const previousPeriodStart = new Date(periodStart);
      previousPeriodStart.setDate(previousPeriodStart.getDate() - periodDays);

      console.log('Fetching orders for periods:', {
        current: { start: periodStart, end: now },
        previous: { start: previousPeriodStart, end: periodStart }
      });

      // Fetch orders for both periods
      const [currentOrders, previousOrders] = await Promise.all([
        fetchOrdersForPeriod(periodStart, now),
        fetchOrdersForPeriod(previousPeriodStart, periodStart)
      ]);

      console.log('Orders fetched:', {
        currentCount: currentOrders.length,
        previousCount: previousOrders.length
      });

      const currentStats = calculateStats(currentOrders);
      const previousStats = calculateStats(previousOrders);

      const stats = {
        period: periodDays,
        orders: currentStats.orders,
        revenue: currentStats.revenue,
        average_order_value: currentStats.averageOrderValue,
        products_sold: currentStats.productsSold,
        orders_change: calculatePercentageChange(currentStats.orders, previousStats.orders),
        revenue_change: calculatePercentageChange(currentStats.revenue, previousStats.revenue),
        average_order_value_change: calculatePercentageChange(currentStats.averageOrderValue, previousStats.averageOrderValue),
        products_sold_change: calculatePercentageChange(currentStats.productsSold, previousStats.productsSold),
        recent_orders: JSON.stringify(currentOrders.slice(0, 10).map(order => ({
          product: order.line_items[0]?.name || 'Unknown Product',
          customer: `${order.billing.first_name} ${order.billing.last_name}`,
          category: order.line_items[0]?.categories?.[0]?.name || 'Uncategorized',
          amount: order.total,
          date: order.date_created
        }))),
        recent_transactions: JSON.stringify(currentOrders.slice(0, 10).map(order => ({
          id: order.number,
          date: new Date(order.date_created).toLocaleDateString(),
          amount: order.total,
          cardType: order.payment_method_title,
          customer: `${order.billing.first_name} ${order.billing.last_name}`
        })))
      };

      console.log('Saving stats to database...');

      // Save to database
      if (existingStats) {
        await woocommerceDb.run(
          `UPDATE woocommerce_stats 
           SET orders = ?, revenue = ?, average_order_value = ?, products_sold = ?,
               orders_change = ?, revenue_change = ?, average_order_value_change = ?,
               products_sold_change = ?, recent_orders = ?, recent_transactions = ?,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
          [
            stats.orders, stats.revenue, stats.average_order_value, stats.products_sold,
            stats.orders_change, stats.revenue_change, stats.average_order_value_change,
            stats.products_sold_change, stats.recent_orders, stats.recent_transactions,
            existingStats.id
          ]
        );
      } else {
        await woocommerceDb.run(
          `INSERT INTO woocommerce_stats (
            period, orders, revenue, average_order_value, products_sold,
            orders_change, revenue_change, average_order_value_change,
            products_sold_change, recent_orders, recent_transactions
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            periodDays, stats.orders, stats.revenue, stats.average_order_value,
            stats.products_sold, stats.orders_change, stats.revenue_change,
            stats.average_order_value_change, stats.products_sold_change,
            stats.recent_orders, stats.recent_transactions
          ]
        );
      }

      console.log('Stats saved successfully');

      return NextResponse.json({ 
        success: true,
        stats: {
          period: periodDays,
          orders: stats.orders,
          revenue: stats.revenue,
          averageOrderValue: stats.average_order_value,
          productsSold: stats.products_sold,
          ordersChange: stats.orders_change,
          revenueChange: stats.revenue_change,
          averageOrderValueChange: stats.average_order_value_change,
          productsSoldChange: stats.products_sold_change,
          recentOrders: JSON.parse(stats.recent_orders || '[]'),
          recentTransactions: JSON.parse(stats.recent_transactions || '[]'),
          lastUpdated: new Date().toISOString()
        }
      });

    } catch (dbError) {
      console.error('Database error:', dbError);
      throw dbError;
    }
  } catch (error) {
    console.error('Sync Error:', error);
    return NextResponse.json({ 
      error: error.message,
      details: error.details 
    }, { status: 500 });
  }
}

function calculatePercentageChange(current, previous) {
  if (!previous) return 0;
  return parseFloat(((current - previous) / previous * 100).toFixed(1));
}
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/config';
import { getDb } from '@/lib/db';
import WooCommerceRestApi from '@woocommerce/woocommerce-rest-api';

// Make the route dynamic
export const dynamic = 'force-dynamic';
export const dynamicParams = true;
export const revalidate = 0;

// Initialize WooCommerce API in the handler to ensure it's only created when needed
async function getWooCommerceApi() {
  return new WooCommerceRestApi({
    url: process.env.WOOCOMMERCE_STORE_URL,
    consumerKey: process.env.WOOCOMMERCE_CONSUMER_KEY,
    consumerSecret: process.env.WOOCOMMERCE_CONSUMER_SECRET,
    version: "wc/v3"
  });
}

async function fetchOrdersForPeriod(startDate, endDate) {
  const api = await getWooCommerceApi();
  const orders = await api.get("orders", {
    after: startDate.toISOString(),
    before: endDate ? endDate.toISOString() : undefined,
    status: ["completed", "processing", "on-hold"],
    per_page: 100,
    orderby: 'date',
    order: 'desc'
  });

  return orders.data;
}

export async function POST(request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Manual sync triggered...');
    
    const { period = '90' } = await request.json().catch(() => ({}));
    const periodDays = parseInt(period);

    const db = await getDb();

    // Fetch WooCommerce data
    const now = new Date();
    const periodStart = new Date(now);
    periodStart.setDate(now.getDate() - periodDays);
    
    console.log('Fetching orders for period:', {
      start: periodStart,
      end: now
    });

    // Fetch orders
    const orders = await fetchOrdersForPeriod(periodStart, now);

    console.log('Orders fetched:', {
      count: orders.length
    });

    // Begin transaction
    await db.sql('BEGIN TRANSACTION');

    try {
      // Process each order
      for (const order of orders) {
        // Check if order exists
        const existingOrder = await db.sql(
          'SELECT id FROM woocommerce_orders WHERE woo_order_id = ? ORDER BY id DESC LIMIT 1',
          [order.id]
        );

        // Prepare order data
        const orderData = {
          woo_order_id: order.id,
          order_number: order.number,
          status: order.status,
          currency: order.currency,
          date_created: order.date_created,
          date_modified: order.date_modified,
          total: order.total,
          customer_id: order.customer_id,
          customer_note: order.customer_note,
          billing: JSON.stringify(order.billing),
          shipping: JSON.stringify(order.shipping),
          payment_method: order.payment_method,
          payment_method_title: order.payment_method_title,
          line_items: JSON.stringify(order.line_items),
          shipping_lines: JSON.stringify(order.shipping_lines),
          tax_lines: JSON.stringify(order.tax_lines),
          fee_lines: JSON.stringify(order.fee_lines),
          coupon_lines: JSON.stringify(order.coupon_lines),
          refunds: JSON.stringify(order.refunds),
          meta_data: JSON.stringify(order.meta_data),
          raw_data: JSON.stringify(order)
        };

        if (existingOrder.length > 0) {
          // Update existing order if status or other details changed
          await db.sql(`
            UPDATE woocommerce_orders 
            SET 
              status = ?,
              currency = ?,
              date_modified = ?,
              total = ?,
              customer_note = ?,
              billing = ?,
              shipping = ?,
              payment_method = ?,
              payment_method_title = ?,
              line_items = ?,
              shipping_lines = ?,
              tax_lines = ?,
              fee_lines = ?,
              coupon_lines = ?,
              refunds = ?,
              meta_data = ?,
              raw_data = ?,
              synced_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `, [
            orderData.status,
            orderData.currency,
            orderData.date_modified,
            orderData.total,
            orderData.customer_note,
            orderData.billing,
            orderData.shipping,
            orderData.payment_method,
            orderData.payment_method_title,
            orderData.line_items,
            orderData.shipping_lines,
            orderData.tax_lines,
            orderData.fee_lines,
            orderData.coupon_lines,
            orderData.refunds,
            orderData.meta_data,
            orderData.raw_data,
            existingOrder[0].id
          ]);
        } else {
          // Insert new order
          await db.sql(`
            INSERT INTO woocommerce_orders (
              woo_order_id, order_number, status, currency, date_created, date_modified,
              total, customer_id, customer_note, billing, shipping, payment_method,
              payment_method_title, line_items, shipping_lines, tax_lines, fee_lines,
              coupon_lines, refunds, meta_data, raw_data
            ) VALUES (
              ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
            )
          `, [
            orderData.woo_order_id,
            orderData.order_number,
            orderData.status,
            orderData.currency,
            orderData.date_created,
            orderData.date_modified,
            orderData.total,
            orderData.customer_id,
            orderData.customer_note,
            orderData.billing,
            orderData.shipping,
            orderData.payment_method,
            orderData.payment_method_title,
            orderData.line_items,
            orderData.shipping_lines,
            orderData.tax_lines,
            orderData.fee_lines,
            orderData.coupon_lines,
            orderData.refunds,
            orderData.meta_data,
            orderData.raw_data
          ]);
        }
      }

      // Commit transaction
      await db.sql('COMMIT');

      return NextResponse.json({
        message: 'Orders synced successfully',
        count: orders.length
      });
    } catch (error) {
      // Rollback on error
      await db.sql('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error syncing orders:', error);
    return NextResponse.json(
      { error: 'Failed to sync orders: ' + error.message },
      { status: 500 }
    );
  }
} 
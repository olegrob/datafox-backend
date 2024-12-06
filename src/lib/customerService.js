import { getDb } from '@/lib/db';

export async function findOrCreateCustomer(orderData) {
  const db = await getDb();
  const { billing, customer_id } = orderData;
  
  // Try to find existing customer
  let customer = null;
  if (customer_id) {
    customer = await db.sql('SELECT * FROM clients WHERE woo_customer_id = ?', [customer_id]);
  }
  if (!customer && billing.email) {
    customer = await db.sql('SELECT * FROM clients WHERE email = ?', [billing.email]);
  }

  const orderTotal = parseFloat(orderData.total);

  if (customer && customer.length > 0) {
    // Update existing customer
    await db.sql(`
      UPDATE clients SET
        first_name = ?,
        last_name = ?,
        company = ?,
        phone = ?,
        billing_address = ?,
        shipping_address = ?,
        total_orders = total_orders + 1,
        total_spent = total_spent + ?,
        last_order_date = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      billing.first_name,
      billing.last_name,
      billing.company,
      billing.phone,
      JSON.stringify(orderData.billing),
      JSON.stringify(orderData.shipping),
      orderTotal,
      customer[0].id
    ]);

    return customer[0].id;
  } else {
    // Create new customer
    const result = await db.sql(`
      INSERT INTO clients (
        woo_customer_id,
        email,
        first_name,
        last_name,
        company,
        phone,
        billing_address,
        shipping_address,
        total_orders,
        total_spent,
        last_order_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, CURRENT_TIMESTAMP)
    `, [
      customer_id,
      billing.email,
      billing.first_name,
      billing.last_name,
      billing.company,
      billing.phone,
      JSON.stringify(orderData.billing),
      JSON.stringify(orderData.shipping),
      orderTotal
    ]);

    return result.lastInsertRowid;
  }
} 
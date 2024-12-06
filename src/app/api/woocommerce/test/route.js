import WooCommerceRestApi from "@woocommerce/woocommerce-rest-api";

const api = new WooCommerceRestApi({
  url: "https://datafox.ee",
  consumerKey: "ck_901d1f22aa07756dd24e7840daece07ea6addd48",
  consumerSecret: "cs_09c7740812df3f4074c903a591dbf22c2d42c033",
  version: "wc/v3"
});

export async function GET() {
  try {
    console.log('Testing WooCommerce connection...');
    
    // Test basic connection
    const systemStatus = await api.get("system_status");
    console.log('System status:', systemStatus.status);

    // Test orders endpoint
    const testOrders = await api.get("orders", {
      per_page: 1
    });
    console.log('Orders endpoint test:', {
      status: testOrders.status,
      totalOrders: testOrders.headers['x-wp-total'],
      totalPages: testOrders.headers['x-wp-totalpages']
    });

    return Response.json({
      success: true,
      systemStatus: systemStatus.status,
      ordersAccess: true,
      totalOrders: testOrders.headers['x-wp-total']
    });
  } catch (error) {
    console.error('WooCommerce Test Error:', error.response?.data || error);
    return Response.json({
      success: false,
      error: error.message,
      response: error.response?.data
    }, { status: 500 });
  }
} 
export async function calculateFinalPrice(product, rules, shippingFees) {
  // Find applicable markup rule
  const price = parseFloat(product.regular_price);
  const applicableRule = rules
    .filter(rule => 
      (!rule.warehouse || rule.warehouse === product.warehouse) &&
      (!rule.min_price || price >= rule.min_price) &&
      (!rule.max_price || price <= rule.max_price)
    )
    .sort((a, b) => b.priority - a.priority)[0];

  // Find applicable shipping fee
  const shippingFee = shippingFees.find(fee => 
    fee.warehouse === product.warehouse
  );

  // Calculate markup
  const markupMultiplier = applicableRule ? (1 + applicableRule.markup_percentage / 100) : 1;
  const priceWithMarkup = price * markupMultiplier;

  // Add shipping fee
  const finalPrice = priceWithMarkup + (shippingFee?.base_fee || 0);

  return {
    originalPrice: price,
    markupPrice: priceWithMarkup,
    shippingFee: shippingFee?.base_fee || 0,
    finalPrice: finalPrice,
    appliedRule: applicableRule,
    appliedShipping: shippingFee
  };
} 
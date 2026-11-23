import { getActiveOrder, getCouponCodeList } from '@/providers/orders';
import { getAvailableCountries, getEligibleShippingMethods, getEligiblePaymentMethods } from '@/providers/checkout';
import { getActiveCustomerAddresses, getActiveCustomer } from '@/providers/customer';
import { getCollections } from '@/providers/collections';
import { getLoyaltyPointsConfig } from '@/providers/custom-plugins';
import { redirect } from 'next/navigation';
import { CheckoutPageClient } from './checkout-page-client';

export default async function CheckoutPage() {
  const activeOrder = await getActiveOrder();

  if (!activeOrder || !activeOrder.active || activeOrder.lines.length === 0) {
    redirect('/');
  }

  const activeCustomerResponse = await getActiveCustomer();
  const isAuthenticated = !!activeCustomerResponse?.activeCustomer?.id;

  if (!isAuthenticated) {
    // Render login gate
    return <CheckoutPageClient needsLogin={true} activeOrder={activeOrder} data={null} />;
  }

  const [
    { availableCountries },
    { eligibleShippingMethods },
    { eligiblePaymentMethods },
    customerAddresses,
    collections,
    couponCodes,
    loyaltyConfig,
  ] = await Promise.all([
    getAvailableCountries(),
    getEligibleShippingMethods(),
    getEligiblePaymentMethods(),
    getActiveCustomerAddresses(),
    getCollections(),
    getCouponCodeList(),
    getLoyaltyPointsConfig().catch(() => null),
  ]);

  const loyaltyPoints =
    activeCustomerResponse?.activeCustomer?.customFields?.loyaltyPointsAvailable ?? null;
  const pointsPerRupee = loyaltyConfig?.pointsPerRupee ?? 100;
  const orderInstructions = (activeOrder as any)?.customFields?.otherInstructions || '';
  const customerGroups = ((activeCustomerResponse?.activeCustomer as any)?.groups ?? []) as Array<{ id: string; name: string }>;

  return (
    <CheckoutPageClient
      needsLogin={false}
      activeOrder={activeOrder}
      data={{
        availableCountries,
        eligibleShippingMethods,
        eligiblePaymentMethods,
        activeCustomer: customerAddresses?.activeCustomer,
        collections: collections ?? [],
        couponCodes,
        loyaltyPoints,
        pointsPerRupee,
        orderInstructions,
        customerGroups,
      }}
    />
  );
}

import { getActiveCustomerAddresses, getActiveCustomerDetails } from '@/providers/customer';
import { AddressesPageClient } from './addresses-page-client';

export default async function AddressesPage() {
  const [addressResult, customerResult] = await Promise.all([
    getActiveCustomerAddresses(),
    getActiveCustomerDetails().catch(() => null),
  ]);

  const addresses = addressResult?.activeCustomer?.addresses ?? [];
  const customer = customerResult?.activeCustomer;

  return (
    <AddressesPageClient
      addresses={addresses}
      activeCustomer={
        customer
          ? {
              firstName: customer.firstName,
              lastName: customer.lastName,
              phoneNumber: customer.phoneNumber ?? undefined,
            }
          : undefined
      }
    />
  );
}

import { getActiveCustomerDetails } from '@/providers/customer';
import { redirect } from 'next/navigation';
import NewAddressClient from './new-address-client';

export default async function NewAddressPage() {
  const result = await getActiveCustomerDetails();
  const customer = result?.activeCustomer;

  if (!customer) {
    redirect('/');
  }

  return (
    <NewAddressClient
      activeCustomer={{
        firstName: customer.firstName,
        lastName: customer.lastName,
        phoneNumber: customer.phoneNumber ?? undefined,
      }}
    />
  );
}

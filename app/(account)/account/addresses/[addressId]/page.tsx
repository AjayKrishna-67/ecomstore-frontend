import { getActiveCustomerAddresses } from '@/providers/customer';
import { redirect } from 'next/navigation';
import EditAddressClient from './edit-address-client';

interface EditAddressPageProps {
  params: Promise<{ addressId: string }>;
}

export default async function EditAddressPage({
  params,
}: EditAddressPageProps) {
  const { addressId } = await params;
  const result = await getActiveCustomerAddresses();
  const addresses = result?.activeCustomer?.addresses ?? [];
  const address = addresses.find((a: any) => a.id === addressId);

  if (!address) {
    redirect('/account/addresses');
  }

  return <EditAddressClient address={address as any} />;
}

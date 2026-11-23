import { getActiveCustomerDetails } from '@/providers/customer';
import AccountDashboardClient from './account-dashboard-client';

export default async function AccountPage() {
  const result = await getActiveCustomerDetails();
  const customer = result?.activeCustomer;

  // Phone-number prompt and referral modal are no longer auto-shown.
  // Users can still update their phone via the explicit "Update / Add" action
  // on the dashboard.
  return (
    <AccountDashboardClient
      customer={customer}
      needsPhoneNumber={false}
      showPhoneModal={false}
      showReferralModal={false}
    />
  );
}

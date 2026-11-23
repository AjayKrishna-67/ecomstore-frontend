import { NextResponse } from 'next/server';
import {
  createCustomerAddress,
  updateCustomerAddress,
  deleteCustomerAddress,
} from '@/providers/account';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { intent } = body;

    if (intent === 'createAddress') {
      const addressData = {
        fullName: body.fullName,
        streetLine1: body.streetLine1,
        streetLine2: body.streetLine2 || undefined,
        city: body.city,
        province: body.province || '',
        postalCode: body.postalCode,
        countryCode: body.countryCode || 'IN',
        phoneNumber: body.phone,
        company: body.company || undefined,
        defaultShippingAddress: body.defaultShippingAddress !== 'false',
      };

      const result = await createCustomerAddress(addressData);
      if (result && (result as any).__typename === 'Address') {
        return NextResponse.json({ success: true });
      }
      return NextResponse.json(
        { error: 'Failed to create address' },
        { status: 400 },
      );
    }

    if (intent === 'updateAddress') {
      const { addressId, ...rest } = body;
      if (!addressId) {
        return NextResponse.json(
          { error: 'Invalid address ID' },
          { status: 400 },
        );
      }
      const addressData = {
        id: addressId,
        fullName: rest.fullName,
        streetLine1: rest.streetLine1,
        streetLine2: rest.streetLine2 || undefined,
        city: rest.city,
        province: rest.province || '',
        postalCode: rest.postalCode,
        countryCode: rest.countryCode || 'IN',
        phoneNumber: rest.phone,
        company: rest.company || undefined,
        defaultShippingAddress:
          rest.defaultShippingAddress === 'true' ||
          rest.defaultShippingAddress === true,
      };

      const result = await updateCustomerAddress(addressData);
      if (result && (result as any).__typename === 'Address') {
        return NextResponse.json({ success: true });
      }
      return NextResponse.json(
        { error: 'Failed to update address' },
        { status: 400 },
      );
    }

    if (intent === 'setDefaultShipping') {
      const { id } = body;
      if (!id) {
        return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
      }
      await updateCustomerAddress({ id, defaultShippingAddress: true });
      return NextResponse.json({ success: true });
    }

    if (intent === 'deleteAddress') {
      const { id } = body;
      if (!id) {
        return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
      }
      await deleteCustomerAddress(id);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid intent' }, { status: 400 });
  } catch (error: any) {
    console.error('Addresses API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 },
    );
  }
}

'use client';

import { useState, useRef } from 'react';
import EditAddressCard from '@/components/account/EditAddressCard';
import { HighlightedButton } from '@/components/HighlightedButton';
import { MapPin, Plus, X } from 'lucide-react';
import CustomerAddressForm from '@/components/account/CustomerAddressForm';
import type { Address } from '@/generated/graphql';
import { trackAddress } from '@/lib/fbpixel';

interface AddressesPageClientProps {
  addresses: any[];
  activeCustomer?: {
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
  };
}

export function AddressesPageClient({
  addresses,
  activeCustomer,
}: AddressesPageClientProps) {
  const [showNewForm, setShowNewForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const newFormRef = useRef<HTMLFormElement>(null);
  const editFormRef = useRef<HTMLFormElement>(null);

  const handleCreateSubmit = async () => {
    if (!newFormRef.current) return;
    const formData = new FormData(newFormRef.current);
    const data: Record<string, string> = {};
    formData.forEach((value, key) => {
      data[key] = value.toString();
    });

    try {
      const res = await fetch('/api/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (result.success) {
        trackAddress('add');
        setShowNewForm(false);
        window.location.reload();
      }
    } catch (error) {
      console.error('Failed to create address:', error);
    }
  };

  const handleEditSubmit = async () => {
    if (!editFormRef.current) return;
    const formData = new FormData(editFormRef.current);
    const data: Record<string, string> = {};
    formData.forEach((value, key) => {
      data[key] = value.toString();
    });

    try {
      const res = await fetch('/api/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (result.success) {
        trackAddress('edit');
        setEditingAddress(null);
        window.location.reload();
      }
    } catch (error) {
      console.error('Failed to update address:', error);
    }
  };

  return (
    <>
      {/* Section heading */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-surface-hover">
            <MapPin className="h-5 w-5 text-btn-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-text-primary">
              Saved Addresses
            </h2>
            <p className="text-sm text-text-tertiary">
              {addresses?.length ?? 0}{' '}
              {(addresses?.length ?? 0) === 1 ? 'address' : 'addresses'} on file
            </p>
          </div>
        </div>
        <HighlightedButton
          type="button"
          className="h-10 px-4 bg-spice hover:bg-spice-600 text-white"
          onClick={() => setShowNewForm(true)}
        >
          <Plus className="h-4 w-4" />
          Add Address
        </HighlightedButton>
      </div>

      {/* Address grid */}
      {!addresses || addresses.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border-theme bg-surface py-16 text-center">
          <div className="w-14 h-14 bg-surface-hover rounded-full flex items-center justify-center mx-auto mb-4">
            <MapPin className="h-7 w-7 text-text-tertiary" />
          </div>
          <h3 className="text-base font-semibold text-text-primary mb-1">
            No addresses yet
          </h3>
          <p className="text-sm text-text-tertiary mb-6">
            Add your first delivery address to speed up checkout
          </p>
          <HighlightedButton
            type="button"
            className="h-10 px-4 bg-spice hover:bg-spice-600 text-white mx-auto"
            onClick={() => setShowNewForm(true)}
          >
            <Plus className="h-4 w-4" />
            Add Address
          </HighlightedButton>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {addresses.map((address: any) => (
            <EditAddressCard
              key={address.id}
              address={address}
              onEdit={() => setEditingAddress(address)}
            />
          ))}
        </div>
      )}

      {/* New Address Modal */}
      {showNewForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-2xl bg-surface border border-border-theme rounded-xl shadow-xl mx-4">
            <button
              onClick={() => setShowNewForm(false)}
              aria-label="Close"
              className="absolute right-3 top-3 p-2 text-text-tertiary hover:text-text-primary rounded-full hover:bg-surface-hover z-10"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="max-h-[85vh] overflow-y-auto">
              <CustomerAddressForm
                formRef={newFormRef}
                submit={handleCreateSubmit}
                isEditing={false}
                activeCustomer={activeCustomer}
              />
            </div>
          </div>
        </div>
      )}

      {/* Edit Address Modal */}
      {editingAddress && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-2xl bg-surface border border-border-theme rounded-xl shadow-xl mx-4">
            <button
              onClick={() => setEditingAddress(null)}
              aria-label="Close"
              className="absolute right-3 top-3 p-2 text-text-tertiary hover:text-text-primary rounded-full hover:bg-surface-hover z-10"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="max-h-[85vh] overflow-y-auto">
              <CustomerAddressForm
                key={editingAddress.id}
                address={editingAddress}
                formRef={editFormRef}
                submit={handleEditSubmit}
                isEditing={true}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

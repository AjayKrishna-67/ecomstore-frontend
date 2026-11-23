'use client';

import { useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import CustomerAddressForm from '@/components/account/CustomerAddressForm';
import { X } from 'lucide-react';

interface NewAddressClientProps {
  activeCustomer?: {
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
  };
}

export default function NewAddressClient({
  activeCustomer,
}: NewAddressClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo');
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleSubmit = async () => {
    if (!formRef.current) return;

    const formData = new FormData(formRef.current);
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
        router.push(redirectTo || '/account/addresses');
        router.refresh();
      }
    } catch (error) {
      console.error('Failed to create address:', error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-xl p-6">
        <button
          onClick={() => router.push(redirectTo || '/account/addresses')}
          className="absolute right-4 top-4 p-2 text-gray-600 hover:text-gray-900 rounded-full hover:bg-gray-100"
        >
          <X className="h-6 w-6" />
        </button>
        <div className="max-h-[80vh] overflow-y-auto">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Add New Address
          </h2>
          <CustomerAddressForm
            formRef={formRef}
            submit={handleSubmit}
            isEditing={false}
            activeCustomer={activeCustomer}
          />
        </div>
      </div>
    </div>
  );
}

'use client';

import { useRef, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import CustomerAddressForm from '@/components/account/CustomerAddressForm';
import Modal from '@/components/modal/Modal';
import type { Address } from '@/generated/graphql';

interface EditAddressClientProps {
  address: Address;
}

export default function EditAddressClient({
  address,
}: EditAddressClientProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleAfterClose = () => {
    router.back();
  };

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
        setIsOpen(false);
        router.push('/account/addresses');
        router.refresh();
      }
    } catch (error) {
      console.error('Failed to update address:', error);
    }
  };

  return (
    <Modal isOpen={isOpen} close={handleClose} afterClose={handleAfterClose}>
      <Modal.Title>Edit Address</Modal.Title>
      <Modal.Body>
        <div className="max-h-[80vh] overflow-y-auto">
          <CustomerAddressForm
            address={address}
            formRef={formRef}
            submit={handleSubmit}
            isEditing={true}
          />
        </div>
      </Modal.Body>
    </Modal>
  );
}

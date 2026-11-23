'use client';

import {
  ArrowPathIcon,
  PencilIcon,
  TrashIcon,
  TruckIcon,
} from '@heroicons/react/24/outline';
import clsx from 'clsx';
import { useState } from 'react';
import { Address, ErrorResult } from '@/generated/graphql';
import { Button } from '../Button';
import { ErrorMessage } from '../ErrorMessage';
import { HighlightedButton } from '../HighlightedButton';
import Modal from '../modal/Modal';
import { useTranslation } from 'react-i18next';
import { trackAddress } from '@/lib/fbpixel';

type EditAddressProps = {
  address: Address;
  isActive?: boolean;
  className?: string;
  onEdit?: () => void;
};

export default function EditAddressCard({
  address,
  isActive = false,
  className,
  onEdit,
}: EditAddressProps) {
  const [setShippingState, setSetShippingState] = useState<'idle' | 'submitting'>('idle');
  const [deleteState, setDeleteState] = useState<'idle' | 'submitting'>('idle');
  const [deleteData, setDeleteData] = useState<ErrorResult | null>(null);
  const [isDeleteModalVisible, setDeleteModalVisible] = useState(false);
  const { t } = useTranslation();

  const handleDeleteSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setDeleteState('submitting');
    try {
      const res = await fetch('/api/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intent: 'deleteAddress', id: address.id }),
      });
      const data = await res.json();
      if (data.success) {
        trackAddress('delete');
        window.location.reload();
      } else if (data?.error) {
        setDeleteData({ message: data.error } as any);
      }
    } finally {
      setDeleteState('idle');
      setDeleteModalVisible(false);
    }
  };

  const handleSetShipping = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSetShippingState('submitting');
    try {
      await fetch('/api/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intent: 'setDefaultShipping', id: address.id }),
      });
      trackAddress('setDefaultShipping');
      window.location.reload();
    } finally {
      setSetShippingState('idle');
    }
  };

  const isDefault = address.defaultShippingAddress;

  return (
    <>
      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalVisible}
        close={() =>
          setDeleteModalVisible(deleteState === 'idle' ? false : true)
        }
      >
        <form method="post" onSubmit={handleDeleteSubmit}>
          <Modal.Title>{t('address.deleteModal.title')}</Modal.Title>
          <Modal.Body>
            <div className="space-y-4 my-4">
              {t('address.deleteModal.confirmation')}
              <input type="hidden" name="id" value={address.id} />
              {deleteData && (
                <ErrorMessage
                  heading={t('address.deleteModal.error')}
                  message={
                    deleteData?.message ?? t('common.defaultError')
                  }
                />
              )}
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button
              type="button"
              onClick={() => setDeleteModalVisible(false)}
              disabled={deleteState !== 'idle'}
            >
              {t('common.cancel')}
            </Button>
            <HighlightedButton
              type="submit"
              name="_action"
              value="deleteAddress"
              disabled={deleteState !== 'idle'}
              isSubmitting={deleteState !== 'idle'}
            >
              {t('common.yes')}
            </HighlightedButton>
          </Modal.Footer>
        </form>
      </Modal>

      {/* Address Card */}
      <div
        className={clsx(
          'group relative rounded-xl border bg-surface p-5 transition-all hover:shadow-md hover:-translate-y-0.5',
          isActive
            ? 'border-btn-primary ring-1 ring-btn-primary/20'
            : 'border-border-theme',
          className,
        )}
      >
        {/* Default pill */}
        {isDefault && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
              <TruckIcon className="w-3 h-3" /> Default shipping
            </span>
          </div>
        )}

        {/* Address info */}
        <div className="space-y-1">
          <p className="font-semibold text-base text-text-primary">
            {address.fullName}
          </p>
          {address.company && (
            <p className="text-sm text-text-secondary">{address.company}</p>
          )}
          <div className="text-sm text-text-tertiary leading-relaxed">
            <p>
              {address.streetLine1}
              {address.streetLine2 && `, ${address.streetLine2}`}
            </p>
            <p>
              {address.postalCode}, {address.city}
            </p>
            <p>
              {address.province && `${address.province}, `}
              {address.country?.code?.toUpperCase()}
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="my-4 border-t border-border-theme" />

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <div className="flex gap-3">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-text-secondary hover:text-btn-primary hover:bg-surface-hover transition-colors"
              onClick={onEdit}
            >
              <PencilIcon className="w-4 h-4" />
              {t('common.edit')}
            </button>

            <button
              type="button"
              title="Delete this address"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-text-secondary hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
              disabled={deleteState !== 'idle'}
              onClick={() => setDeleteModalVisible(true)}
            >
              {deleteState === 'idle' ? (
                <TrashIcon className="w-4 h-4" />
              ) : (
                <ArrowPathIcon className="w-4 h-4 animate-spin" />
              )}
              {t('common.remove')}
            </button>
          </div>

          {/* Set-as-default action */}
          {!address.defaultShippingAddress && (
            <div className="flex gap-2">
              <form method="post" onSubmit={handleSetShipping}>
                <input type="hidden" name="id" value={address.id} />
                <button
                  name="_action"
                  value="setDefaultShipping"
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs text-text-tertiary hover:text-btn-primary hover:bg-surface-hover transition-colors border border-border-theme"
                  disabled={setShippingState !== 'idle'}
                >
                  {setShippingState === 'idle' ? (
                    <TruckIcon className="w-3.5 h-3.5" />
                  ) : (
                    <ArrowPathIcon className="w-3.5 h-3.5 animate-spin" />
                  )}
                  Set as default
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

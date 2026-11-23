'use client';

import { PlusIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';

interface AddAddressCardProps {
  onClick?: () => void;
}

export default function AddAddressCard({ onClick }: AddAddressCardProps) {
  const { t } = useTranslation();

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center justify-center gap-2 mt-3 w-full min-h-[64px] border-2 border-dashed border-blue-500 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg shadow-sm transition-all duration-200 ease-in-out"
    >
      <PlusIcon className="w-5 h-5" />
      <span className="font-semibold">{t('address.new')}</span>
    </button>
  );
}

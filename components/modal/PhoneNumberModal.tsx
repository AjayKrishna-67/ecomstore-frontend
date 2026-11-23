'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { HighlightedButton } from '@/components/HighlightedButton';
import { z } from 'zod';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export enum FormIntent {
  UpdatePhone = 'updatePhone',
}

export type FormError = {
  message: string;
  intent?: string;
};

const phoneNumberSchema = z.object({
  phoneNumber: z
    .string()
    .min(1, { message: 'Phone number is required' })
    .regex(/^\+?[1-9]\d{1,14}$/, { message: 'Invalid phone number format' }),
});

export { phoneNumberSchema as phoneNumberValidator };

interface PhoneNumberModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formError?: FormError;
  isSubmitting: boolean;
  fetcher: any;
}

export function PhoneNumberModal({
  open,
  onOpenChange,
  formError,
  isSubmitting,
  fetcher,
}: PhoneNumberModalProps) {
  const { t } = useTranslation();
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const phoneNumber = formData.get('phoneNumber')?.toString() || '';

    const result = phoneNumberSchema.safeParse({ phoneNumber });
    if (!result.success) {
      setValidationError(result.error.errors[0]?.message || 'Invalid input');
      return;
    }

    setValidationError(null);

    // Submit via fetch to /account API
    try {
      const response = await fetch('/api/active-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intent: FormIntent.UpdatePhone,
          phoneNumber,
        }),
      });
      if (response.ok) {
        onOpenChange(false);
      }
    } catch {
      // handled by formError prop
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white">
        <form onSubmit={handleSubmit} id="phone-number-form">
          <DialogHeader>
            <DialogTitle>Add PhoneNumber</DialogTitle>
            <DialogDescription>
              Please enter your phone number to help us secure your account.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <input
              type="hidden"
              name="intent"
              value={FormIntent.UpdatePhone}
            />
            <div className="space-y-2">
              <Input
                id="phoneNumber"
                name="phoneNumber"
                type="tel"
                required
                placeholder="Enter 10 digit phone number"
                autoFocus
              />
              {validationError && (
                <p className="text-sm text-red-500">{validationError}</p>
              )}
            </div>

            {formError && formError.intent === FormIntent.UpdatePhone && (
              <div className="p-3 bg-destructive/15 border border-destructive/20 rounded-md">
                <p className="text-sm text-destructive">{formError.message}</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <HighlightedButton type="submit" isSubmitting={isSubmitting}>
              {isSubmitting ? t('common.saving') : t('common.save')}
            </HighlightedButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

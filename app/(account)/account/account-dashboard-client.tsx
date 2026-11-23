'use client';

import type React from 'react';
import { useEffect, useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { HighlightedButton } from '@/components/HighlightedButton';
import {
  User,
  Edit,
  Mail,
  Check,
  Phone,
  Gift,
  BadgeCheck,
} from 'lucide-react';
import { trackUpdateProfile } from '@/lib/fbpixel';

enum FormIntent {
  UpdateEmail = 'updateEmail',
  UpdateDetails = 'updateDetails',
  UpdatePhone = 'updatePhone',
}

interface AccountDashboardClientProps {
  customer: any;
  needsPhoneNumber: boolean;
  showPhoneModal: boolean;
  showReferralModal: boolean;
}

function replaceEmptyString(value: string | null | undefined): string {
  return value?.trim() ? value : '—';
}

function getInitials(first?: string, last?: string): string {
  const a = first?.[0] ?? '';
  const b = last?.[0] ?? '';
  return (a + b).toUpperCase() || '👤';
}

export default function AccountDashboardClient({
  customer,
  needsPhoneNumber,
  showPhoneModal,
  showReferralModal,
}: AccountDashboardClientProps) {
  const { firstName, lastName, emailAddress, phoneNumber, title } = customer;

  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<{
    message: string;
    intent?: string;
  } | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const phoneFormRef = useRef<HTMLFormElement>(null);

  const [showPhoneNumberModal, setShowPhoneNumberModal] = useState(
    showPhoneModal || needsPhoneNumber,
  );

  const [showReferralDialog, setShowReferralDialog] = useState(false);
  const [referralCode, setReferralCode] = useState('');
  const [referralSuccess, setReferralSuccess] = useState(false);
  const [referralError, setReferralError] = useState('');
  const [referralSubmitting, setReferralSubmitting] = useState(false);

  const groupName = customer?.groups?.[0]?.name || null;
  const fullName = `${title ? title + ' ' : ''}${firstName} ${lastName}`.trim();

  useEffect(() => {
    if (!showReferralModal || !customer?.id) return;
    if (showPhoneNumberModal) return;
    const key = `referralPopupShown_${customer.id}`;
    if (typeof window !== 'undefined' && !localStorage.getItem(key)) {
      setShowReferralDialog(true);
    }
  }, [showReferralModal, customer?.id, showPhoneNumberModal]);

  async function handleDetailsSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);

    const formData = new FormData(e.currentTarget);
    const data = {
      intent: FormIntent.UpdateDetails,
      title: formData.get('title') as string,
      firstName: formData.get('firstName') as string,
      lastName: formData.get('lastName') as string,
    };

    if (!data.firstName?.trim()) {
      setFormError({
        message: 'First name is required',
        intent: FormIntent.UpdateDetails,
      });
      setIsSubmitting(false);
      return;
    }
    if (!data.lastName?.trim()) {
      setFormError({
        message: 'Last name is required',
        intent: FormIntent.UpdateDetails,
      });
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch('/api/account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (res.ok && result.success) {
        trackUpdateProfile(FormIntent.UpdateDetails);
        setIsEditing(false);
        setFormError(null);
        window.location.href = '/account';
      } else {
        setFormError({
          message: result.error || result.message || 'Failed to update customer details',
          intent: FormIntent.UpdateDetails,
        });
      }
    } catch (error: any) {
      setFormError({
        message: error.message || 'Failed to update customer details',
        intent: FormIntent.UpdateDetails,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handlePhoneSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);

    const formData = new FormData(e.currentTarget);
    const phoneValue = (formData.get('phoneNumber') as string)
      ?.replace(/\D/g, '')
      .slice(0, 10);

    if (!phoneValue || phoneValue.length !== 10) {
      setFormError({
        message: 'Phone number must be exactly 10 digits',
        intent: FormIntent.UpdatePhone,
      });
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch('/api/account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intent: FormIntent.UpdatePhone,
          phoneNumber: phoneValue,
        }),
      });
      const result = await res.json();
      if (res.ok && result.success) {
        trackUpdateProfile(FormIntent.UpdatePhone);
        setShowPhoneNumberModal(false);
        setFormError(null);
        window.location.href = '/account';
      } else {
        setFormError({
          message: result.error || result.message || 'Failed to update phone number',
          intent: FormIntent.UpdatePhone,
        });
      }
    } catch (error: any) {
      setFormError({
        message: error.message || 'Failed to update phone number',
        intent: FormIntent.UpdatePhone,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleReferralSubmit() {
    if (!referralCode.trim()) return;
    setReferralSubmitting(true);
    setReferralError('');

    try {
      const res = await fetch('/api/referral', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionType: 'register-referral',
          referrerId: referralCode.trim(),
        }),
      });
      const result = await res.json();
      if (result.success) {
        setReferralSuccess(true);
        setReferralError('');
        if (customer?.id) {
          localStorage.setItem(`referralPopupShown_${customer.id}`, 'true');
        }
        setTimeout(() => setShowReferralDialog(false), 2000);
      } else {
        setReferralError(result.error || 'Failed to apply referral code');
      }
    } catch (error: any) {
      setReferralError(error.message || 'Failed to apply referral code');
    } finally {
      setReferralSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Profile hero */}
      <div className="flex items-center gap-4 rounded-xl border border-border-theme bg-surface p-5">
        <div className="flex items-center justify-center w-14 h-14 shrink-0 rounded-full bg-btn-primary text-btn-primary-text text-lg font-semibold">
          {getInitials(firstName, lastName)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg font-semibold text-text-primary truncate">
              {replaceEmptyString(fullName)}
            </h2>
            {groupName && (
              <span className="text-[11px] font-medium uppercase tracking-wide px-2 py-0.5 rounded-full bg-spice/10 text-spice">
                {groupName}
              </span>
            )}
          </div>
          <p className="text-sm text-text-tertiary truncate">{emailAddress}</p>
        </div>
      </div>

      {/* Personal info card */}
      <section className="rounded-xl border border-border-theme bg-surface">
        <header className="flex items-center justify-between gap-3 px-5 py-4 border-b border-border-theme">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-surface-hover">
              <User className="h-4 w-4 text-btn-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-text-primary">
                Personal information
              </h3>
              <p className="text-xs text-text-tertiary">
                Your name and title used for orders
              </p>
            </div>
          </div>
          {!isEditing && (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-btn-primary hover:underline"
            >
              <Edit className="w-4 h-4" /> Edit
            </button>
          )}
        </header>

        <div className="px-5 py-5">
          {isEditing ? (
            <form ref={formRef} onSubmit={handleDetailsSubmit} id="details">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="title"
                    className="text-xs font-semibold text-text-secondary uppercase tracking-wide"
                  >
                    Title
                  </Label>
                  <Select name="title" defaultValue={title || 'None'}>
                    <SelectTrigger className="h-10 border-border-theme bg-input-bg text-text-primary focus:ring-gold">
                      <SelectValue placeholder="Select title" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Mr.">Mr.</SelectItem>
                      <SelectItem value="Mrs.">Mrs.</SelectItem>
                      <SelectItem value="Miss.">Miss.</SelectItem>
                      <SelectItem value="Ms.">Ms.</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="firstName"
                    className="text-xs font-semibold text-text-secondary uppercase tracking-wide"
                  >
                    First name <span className="text-spice">*</span>
                  </Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    required
                    className="h-10 border-border-theme bg-input-bg text-text-primary"
                    defaultValue={firstName || ''}
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="lastName"
                    className="text-xs font-semibold text-text-secondary uppercase tracking-wide"
                  >
                    Last name <span className="text-spice">*</span>
                  </Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    required
                    className="h-10 border-border-theme bg-input-bg text-text-primary"
                    defaultValue={lastName || ''}
                  />
                </div>
              </div>
              {formError && formError.intent === FormIntent.UpdateDetails && (
                <div className="mt-4 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-lg">
                  <p className="text-sm text-red-600 dark:text-red-300 font-medium">
                    {formError.message}
                  </p>
                </div>
              )}
              <div className="flex gap-3 mt-5">
                <HighlightedButton
                  type="submit"
                  isSubmitting={isSubmitting}
                  className="h-10 px-5 bg-spice hover:bg-spice-600 text-white"
                >
                  <Check className="h-4 w-4" /> Save
                </HighlightedButton>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                  className="h-10 px-5 border-border-theme text-text-primary hover:bg-surface-hover"
                >
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">
                  Title
                </dt>
                <dd className="mt-1 text-sm text-text-primary">
                  {replaceEmptyString(title)}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">
                  First name
                </dt>
                <dd className="mt-1 text-sm text-text-primary">
                  {replaceEmptyString(firstName)}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">
                  Last name
                </dt>
                <dd className="mt-1 text-sm text-text-primary">
                  {replaceEmptyString(lastName)}
                </dd>
              </div>
            </dl>
          )}
        </div>
      </section>

      {/* Contact card */}
      <section className="rounded-xl border border-border-theme bg-surface">
        <header className="flex items-center gap-3 px-5 py-4 border-b border-border-theme">
          <div className="p-2 rounded-lg bg-surface-hover">
            <Mail className="h-4 w-4 text-btn-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text-primary">
              Contact
            </h3>
            <p className="text-xs text-text-tertiary">
              Where we send updates and order confirmations
            </p>
          </div>
        </header>

        <div className="divide-y divide-border-theme">
          {/* Email row */}
          <div className="flex items-center justify-between gap-3 px-5 py-4">
            <div className="flex items-center gap-3 min-w-0">
              <Mail className="h-4 w-4 text-text-tertiary shrink-0" />
              <div className="min-w-0">
                <div className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">
                  Email address
                </div>
                <div className="mt-0.5 text-sm text-text-primary truncate">
                  {emailAddress}
                </div>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300">
              <BadgeCheck className="w-3.5 h-3.5" /> Verified
            </span>
          </div>

          {/* Phone row */}
          <div className="flex items-center justify-between gap-3 px-5 py-4">
            <div className="flex items-center gap-3 min-w-0">
              <Phone className="h-4 w-4 text-text-tertiary shrink-0" />
              <div className="min-w-0">
                <div className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">
                  Phone number
                </div>
                <div className="mt-0.5 text-sm text-text-primary">
                  {phoneNumber ? (
                    phoneNumber
                  ) : (
                    <span className="text-text-muted italic">Not provided</span>
                  )}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowPhoneNumberModal(true)}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-btn-primary hover:underline"
            >
              <Edit className="w-4 h-4" /> {phoneNumber ? 'Update' : 'Add'}
            </button>
          </div>
        </div>
      </section>

      {/* Phone Number Update Modal */}
      <Dialog
        open={showPhoneNumberModal}
        onOpenChange={(open) => {
          if (!open && !needsPhoneNumber) setShowPhoneNumberModal(false);
        }}
      >
        <DialogContent className="sm:max-w-[500px] !bg-surface">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-text-primary">
              {phoneNumber ? 'Update phone number' : 'Add phone number'}
            </DialogTitle>
            {needsPhoneNumber && (
              <p className="text-sm text-text-tertiary mt-1">
                Please add your phone number to complete your profile.
              </p>
            )}
          </DialogHeader>
          <form
            ref={phoneFormRef}
            onSubmit={handlePhoneSubmit}
            id="phone-number"
          >
            <div className="space-y-3 py-3">
              <div className="space-y-2">
                <Label
                  htmlFor="phoneNumber"
                  className="text-xs font-semibold text-text-secondary uppercase tracking-wide"
                >
                  Phone number <span className="text-spice">*</span>
                </Label>
                <Input
                  id="phoneNumber"
                  name="phoneNumber"
                  required
                  type="tel"
                  maxLength={10}
                  className="h-10 border-border-theme focus:ring-gold focus:border-navy text-text-primary !bg-input-bg"
                  placeholder="Enter 10 digit phone number"
                  defaultValue={phoneNumber || ''}
                  onInput={(e) => {
                    const target = e.target as HTMLInputElement;
                    target.value = target.value.replace(/\D/g, '').slice(0, 10);
                  }}
                />
                <p className="text-xs !text-text-muted">
                  10 digits, e.g. 9876543210
                </p>
              </div>
              {formError && formError.intent === FormIntent.UpdatePhone && (
                <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-lg">
                  <p className="text-sm text-red-600 dark:text-red-300 font-medium">
                    {formError.message}
                  </p>
                </div>
              )}
            </div>
            <DialogFooter>
              <div className="flex gap-3 w-full">
                {!needsPhoneNumber && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowPhoneNumberModal(false)}
                    className="flex-1 border-border-theme text-text-primary hover:bg-surface-hover"
                  >
                    Cancel
                  </Button>
                )}
                <HighlightedButton
                  type="submit"
                  isSubmitting={isSubmitting}
                  className={`flex-1 bg-spice hover:bg-spice-600 text-white ${
                    needsPhoneNumber ? 'w-full' : ''
                  }`}
                >
                  {phoneNumber ? 'Update' : 'Add'}
                </HighlightedButton>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Referral Code Dialog */}
      <Dialog
        open={showReferralDialog}
        onOpenChange={(open) => {
          setShowReferralDialog(open);
          if (!open && customer?.id) {
            localStorage.setItem(
              `referralPopupShown_${customer.id}`,
              'true',
            );
          }
        }}
      >
        <DialogContent className="sm:max-w-[500px] !bg-surface">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-text-primary">
              Enter referral code
            </DialogTitle>
            <p className="text-sm text-text-tertiary mt-1">
              Enter your friend&apos;s referral code to earn rewards on your
              first purchase.
            </p>
          </DialogHeader>
          <div className="space-y-3 py-3">
            <div className="space-y-2">
              <Label
                htmlFor="referralCode"
                className="text-xs font-semibold text-text-secondary uppercase tracking-wide"
              >
                Referral code <span className="text-spice">*</span>
              </Label>
              <Input
                id="referralCode"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value)}
                className="h-10 border-border-theme focus:ring-gold focus:border-navy text-text-primary !bg-input-bg"
                placeholder="e.g. ABC123"
              />
            </div>
            {referralError && (
              <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-300 font-medium">
                  {referralError}
                </p>
              </div>
            )}
            {referralSuccess && (
              <div className="p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900/50 rounded-lg">
                <p className="text-sm text-green-700 dark:text-green-300 font-medium">
                  Referral code applied successfully!
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <div className="flex gap-3 w-full">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowReferralDialog(false)}
                className="flex-1 border-border-theme text-text-primary hover:bg-surface-hover"
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={!referralCode.trim() || referralSubmitting}
                onClick={handleReferralSubmit}
                className="flex-1 bg-spice hover:bg-spice-600 text-white"
              >
                <Gift className="w-4 h-4 mr-1" />
                {referralSubmitting ? 'Submitting...' : 'Apply'}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

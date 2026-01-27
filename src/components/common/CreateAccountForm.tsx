'use client';

import React, { useState } from 'react';
import { ChevronLeft, Building2, User, Mail, Phone, Key, Tag, MapPin } from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';

// ── Types ────────────────────────────────────────────────
type CreateAccountPayload = {
  // Owner profile details
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  password: string;

  // Account details
  account_name: string;
  contact_phone: string;
  contact_email: string;
  kra_pin: string;
  industry: string;

  // Optional referral fields
  referrer_user_id: string | null;
  installer_user_id: string | null;

  // Outlet details
  outlet_name: string;
  outlet_phone: string;
  outlet_email: string;
};

type CreateAccountFormProps = {
  onSubmit: (payload: CreateAccountPayload) => Promise<void>;
  onCancel?: () => void;
  initialData?: Partial<CreateAccountPayload>;
  isLoading?: boolean;
};

type ValidationErrors = Partial<Record<keyof CreateAccountPayload, string>>;

// Industry options
const industryOptions = [
  { value: 'food_vendor', label: 'Food Vendor' },
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'bar', label: 'Bar & Lounge' },
  { value: 'hotel', label: 'Hotel' },
  { value: 'cafe', label: 'Café' },
  { value: 'retail', label: 'Retail Store' },
  { value: 'other', label: 'Other' },
];

const CreateAccountForm: React.FC<CreateAccountFormProps> = ({
  onSubmit,
  onCancel,
  initialData,
  isLoading = false,
}) => {
  // ── Form State ────────────────────────────────────────
  const [formData, setFormData] = useState<CreateAccountPayload>({
    // Owner profile
    first_name: initialData?.first_name || '',
    last_name: initialData?.last_name || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    password: initialData?.password || '',

    // Account details
    account_name: initialData?.account_name || '',
    contact_phone: initialData?.contact_phone || '',
    contact_email: initialData?.contact_email || '',
    kra_pin: initialData?.kra_pin || '',
    industry: initialData?.industry || 'food_vendor',

    // Optional
    referrer_user_id: initialData?.referrer_user_id || null,
    installer_user_id: initialData?.installer_user_id || null,

    // Outlet
    outlet_name: initialData?.outlet_name || '',
    outlet_phone: initialData?.outlet_phone || '',
    outlet_email: initialData?.outlet_email || '',
  });

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [showPassword, setShowPassword] = useState(false);

  // ── Validation ────────────────────────────────────────
  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    // Owner profile validation
    if (!formData.first_name.trim()) {
      newErrors.first_name = 'First name is required';
    }
    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Last name is required';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }
    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 4) {
      newErrors.password = 'Password must be at least 4 characters';
    }

    // Account details validation
    if (!formData.account_name.trim()) {
      newErrors.account_name = 'Account name is required';
    }
    if (!formData.contact_phone.trim()) {
      newErrors.contact_phone = 'Contact phone is required';
    }
    if (!formData.contact_email.trim()) {
      newErrors.contact_email = 'Contact email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contact_email)) {
      newErrors.contact_email = 'Invalid email format';
    }
    if (!formData.kra_pin.trim()) {
      newErrors.kra_pin = 'KRA PIN is required';
    }

    // Outlet validation
    if (!formData.outlet_name.trim()) {
      newErrors.outlet_name = 'Outlet name is required';
    }
    if (!formData.outlet_phone.trim()) {
      newErrors.outlet_phone = 'Outlet phone is required';
    }
    if (!formData.outlet_email.trim()) {
      newErrors.outlet_email = 'Outlet email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.outlet_email)) {
      newErrors.outlet_email = 'Invalid email format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ── Handlers ──────────────────────────────────────────
  const handleInputChange = (field: keyof CreateAccountPayload, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };

  // ── Render ─────────────────────────────────────────────
  return (
    <div className="h-full flex flex-col bg-white dark:bg-neutral-900">
      <div className="flex-1 flex flex-col lg:flex-row gap-10 overflow-y-auto p-6">
        {/* Left Column: Account Details */}
        <div className="flex-1 space-y-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Building2 size={20} className="text-primary" />
            </div>
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">
              Account Details
            </h2>
          </div>

          {/* Account Name */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200 mb-2">
              Account Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.account_name}
                onChange={(e) => handleInputChange('account_name', e.target.value)}
                placeholder="e.g. Nairobi Drinks & Spirits"
                className={clsx(
                  'w-full px-4 py-2.5 pl-10 text-sm border rounded-lg transition-colors',
                  'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100',
                  'focus:outline-none focus:ring-2 focus:ring-primary',
                  errors.account_name
                    ? 'border-red-500 dark:border-red-500'
                    : 'border-neutral-300 dark:border-neutral-700'
                )}
              />
              <Building2
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
              />
            </div>
            {errors.account_name && (
              <p className="mt-1 text-xs text-red-500">{errors.account_name}</p>
            )}
          </div>

          {/* Contact Phone */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200 mb-2">
              Contact Phone <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="tel"
                value={formData.contact_phone}
                onChange={(e) => handleInputChange('contact_phone', e.target.value)}
                placeholder="254700000000"
                className={clsx(
                  'w-full px-4 py-2.5 pl-10 text-sm border rounded-lg transition-colors',
                  'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100',
                  'focus:outline-none focus:ring-2 focus:ring-primary',
                  errors.contact_phone
                    ? 'border-red-500 dark:border-red-500'
                    : 'border-neutral-300 dark:border-neutral-700'
                )}
              />
              <Phone
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
              />
            </div>
            {errors.contact_phone && (
              <p className="mt-1 text-xs text-red-500">{errors.contact_phone}</p>
            )}
          </div>

          {/* Contact Email */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200 mb-2">
              Contact Email <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="email"
                value={formData.contact_email}
                onChange={(e) => handleInputChange('contact_email', e.target.value)}
                placeholder="info@nairobidrinks.co.ke"
                className={clsx(
                  'w-full px-4 py-2.5 pl-10 text-sm border rounded-lg transition-colors',
                  'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100',
                  'focus:outline-none focus:ring-2 focus:ring-primary',
                  errors.contact_email
                    ? 'border-red-500 dark:border-red-500'
                    : 'border-neutral-300 dark:border-neutral-700'
                )}
              />
              <Mail
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
              />
            </div>
            {errors.contact_email && (
              <p className="mt-1 text-xs text-red-500">{errors.contact_email}</p>
            )}
          </div>

          {/* KRA PIN */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200 mb-2">
              KRA PIN <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.kra_pin}
                onChange={(e) => handleInputChange('kra_pin', e.target.value.toUpperCase())}
                placeholder="A012345678B"
                className={clsx(
                  'w-full px-4 py-2.5 pl-10 text-sm border rounded-lg transition-colors uppercase',
                  'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100',
                  'focus:outline-none focus:ring-2 focus:ring-primary',
                  errors.kra_pin
                    ? 'border-red-500 dark:border-red-500'
                    : 'border-neutral-300 dark:border-neutral-700'
                )}
              />
              <Tag
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
              />
            </div>
            {errors.kra_pin && (
              <p className="mt-1 text-xs text-red-500">{errors.kra_pin}</p>
            )}
          </div>

          {/* Industry */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200 mb-2">
              Industry <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.industry}
              onChange={(e) => handleInputChange('industry', e.target.value)}
              className={clsx(
                'w-full px-4 py-2.5 text-sm border rounded-lg transition-colors',
                'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100',
                'focus:outline-none focus:ring-2 focus:ring-primary',
                'border-neutral-300 dark:border-neutral-700'
              )}
            >
              {industryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Outlet Details Section */}
          <div className="pt-6 mt-6 border-t border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <MapPin size={20} className="text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
                First Outlet Details
              </h3>
            </div>

            {/* Outlet Name */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200 mb-2">
                Outlet Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.outlet_name}
                onChange={(e) => handleInputChange('outlet_name', e.target.value)}
                placeholder="e.g. Westlands Branch"
                className={clsx(
                  'w-full px-4 py-2.5 text-sm border rounded-lg transition-colors',
                  'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100',
                  'focus:outline-none focus:ring-2 focus:ring-primary',
                  errors.outlet_name
                    ? 'border-red-500 dark:border-red-500'
                    : 'border-neutral-300 dark:border-neutral-700'
                )}
              />
              {errors.outlet_name && (
                <p className="mt-1 text-xs text-red-500">{errors.outlet_name}</p>
              )}
            </div>

            {/* Outlet Phone */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200 mb-2">
                Outlet Phone <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={formData.outlet_phone}
                onChange={(e) => handleInputChange('outlet_phone', e.target.value)}
                placeholder="0733567890"
                className={clsx(
                  'w-full px-4 py-2.5 text-sm border rounded-lg transition-colors',
                  'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100',
                  'focus:outline-none focus:ring-2 focus:ring-primary',
                  errors.outlet_phone
                    ? 'border-red-500 dark:border-red-500'
                    : 'border-neutral-300 dark:border-neutral-700'
                )}
              />
              {errors.outlet_phone && (
                <p className="mt-1 text-xs text-red-500">{errors.outlet_phone}</p>
              )}
            </div>

            {/* Outlet Email */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200 mb-2">
                Outlet Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={formData.outlet_email}
                onChange={(e) => handleInputChange('outlet_email', e.target.value)}
                placeholder="westlands@nairobidrinks.co.ke"
                className={clsx(
                  'w-full px-4 py-2.5 text-sm border rounded-lg transition-colors',
                  'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100',
                  'focus:outline-none focus:ring-2 focus:ring-primary',
                  errors.outlet_email
                    ? 'border-red-500 dark:border-red-500'
                    : 'border-neutral-300 dark:border-neutral-700'
                )}
              />
              {errors.outlet_email && (
                <p className="mt-1 text-xs text-red-500">{errors.outlet_email}</p>
              )}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="hidden lg:block w-px bg-neutral-200 dark:bg-neutral-800 self-stretch" />

        {/* Right Column: Owner Profile */}
        <div className="flex-1 space-y-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <User size={20} className="text-primary" />
            </div>
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">
              Owner Profile
            </h2>
          </div>

          {/* First Name */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200 mb-2">
              First Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.first_name}
                onChange={(e) => handleInputChange('first_name', e.target.value)}
                placeholder="Peter"
                className={clsx(
                  'w-full px-4 py-2.5 pl-10 text-sm border rounded-lg transition-colors',
                  'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100',
                  'focus:outline-none focus:ring-2 focus:ring-primary',
                  errors.first_name
                    ? 'border-red-500 dark:border-red-500'
                    : 'border-neutral-300 dark:border-neutral-700'
                )}
              />
              <User
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
              />
            </div>
            {errors.first_name && (
              <p className="mt-1 text-xs text-red-500">{errors.first_name}</p>
            )}
          </div>

          {/* Last Name */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200 mb-2">
              Last Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.last_name}
                onChange={(e) => handleInputChange('last_name', e.target.value)}
                placeholder="Kamande"
                className={clsx(
                  'w-full px-4 py-2.5 pl-10 text-sm border rounded-lg transition-colors',
                  'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100',
                  'focus:outline-none focus:ring-2 focus:ring-primary',
                  errors.last_name
                    ? 'border-red-500 dark:border-red-500'
                    : 'border-neutral-300 dark:border-neutral-700'
                )}
              />
              <User
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
              />
            </div>
            {errors.last_name && (
              <p className="mt-1 text-xs text-red-500">{errors.last_name}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200 mb-2">
              Email Address <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="peter@nairobidrinks.co.ke"
                className={clsx(
                  'w-full px-4 py-2.5 pl-10 text-sm border rounded-lg transition-colors',
                  'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100',
                  'focus:outline-none focus:ring-2 focus:ring-primary',
                  errors.email
                    ? 'border-red-500 dark:border-red-500'
                    : 'border-neutral-300 dark:border-neutral-700'
                )}
              />
              <Mail
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-xs text-red-500">{errors.email}</p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200 mb-2">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="0721567890"
                className={clsx(
                  'w-full px-4 py-2.5 pl-10 text-sm border rounded-lg transition-colors',
                  'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100',
                  'focus:outline-none focus:ring-2 focus:ring-primary',
                  errors.phone
                    ? 'border-red-500 dark:border-red-500'
                    : 'border-neutral-300 dark:border-neutral-700'
                )}
              />
              <Phone
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
              />
            </div>
            {errors.phone && (
              <p className="mt-1 text-xs text-red-500">{errors.phone}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200 mb-2">
              Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                placeholder="Enter secure password"
                className={clsx(
                  'w-full px-4 py-2.5 pl-10 pr-10 text-sm border rounded-lg transition-colors',
                  'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100',
                  'focus:outline-none focus:ring-2 focus:ring-primary',
                  errors.password
                    ? 'border-red-500 dark:border-red-500'
                    : 'border-neutral-300 dark:border-neutral-700'
                )}
              />
              <Key
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
              >
                {showPassword ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-xs text-red-500">{errors.password}</p>
            )}
            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
              Minimum 4 characters
            </p>
          </div>

          {/* Optional: Referral Fields */}
          <div className="pt-6 mt-6 border-t border-neutral-200 dark:border-neutral-700">
            <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-4">
              Optional Referral Information
            </h3>

            {/* Referrer User ID */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200 mb-2">
                Referrer User ID
              </label>
              <input
                type="text"
                value={formData.referrer_user_id || ''}
                onChange={(e) => handleInputChange('referrer_user_id', e.target.value || null)}
                placeholder="Optional"
                className={clsx(
                  'w-full px-4 py-2.5 text-sm border rounded-lg transition-colors',
                  'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100',
                  'focus:outline-none focus:ring-2 focus:ring-primary',
                  'border-neutral-300 dark:border-neutral-700'
                )}
              />
            </div>

            {/* Installer User ID */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200 mb-2">
                Installer User ID
              </label>
              <input
                type="text"
                value={formData.installer_user_id || ''}
                onChange={(e) => handleInputChange('installer_user_id', e.target.value || null)}
                placeholder="Optional"
                className={clsx(
                  'w-full px-4 py-2.5 text-sm border rounded-lg transition-colors',
                  'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100',
                  'focus:outline-none focus:ring-2 focus:ring-primary',
                  'border-neutral-300 dark:border-neutral-700'
                )}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex justify-between items-center px-6 py-4 border-t border-neutral-200 dark:border-neutral-800">
        <div className="flex gap-4">
          <button
            type="button"
            onClick={handleCancel}
            disabled={isLoading}
            className={clsx(
              'px-6 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg',
              'text-neutral-700 dark:text-neutral-300 transition-colors',
              isLoading
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:bg-neutral-50 dark:hover:bg-neutral-800'
            )}
          >
            Cancel
          </button>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={isLoading}
          className={clsx(
            'px-8 py-2 bg-primary text-white rounded-lg font-medium transition-colors',
            isLoading
              ? 'opacity-50 cursor-not-allowed'
              : 'hover:bg-primary/90'
          )}
        >
          {isLoading ? 'Creating Account...' : 'Create Account'}
        </button>
      </div>
    </div>
  );
};

export default CreateAccountForm;
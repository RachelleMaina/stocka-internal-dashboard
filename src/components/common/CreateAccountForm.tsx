'use client';

import React, { useState, useEffect } from 'react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import Select, { SingleValue } from 'react-select';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

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

type ValidationErrors = Partial<Record<keyof CreateAccountPayload | 'confirm_password', string>>;

type IndustryOption = {
  value: string;
  label: string;
};

// Industry options
const industryOptions: IndustryOption[] = [
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

    // Outlet (auto-filled from account)
    outlet_name: initialData?.outlet_name || '',
    outlet_phone: initialData?.outlet_phone || '',
    outlet_email: initialData?.outlet_email || '',
  });

  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Auto-fill outlet details when account details change
  useEffect(() => {
    if (!initialData) {
      setFormData((prev) => ({
        ...prev,
        outlet_name: prev.account_name,
        outlet_phone: prev.contact_phone,
        outlet_email: prev.contact_email,
      }));
    }
  }, [formData.account_name, formData.contact_phone, formData.contact_email, initialData]);

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
    if (formData.password !== confirmPassword) {
      newErrors.confirm_password = 'Passwords do not match';
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

  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value);
    if (errors.confirm_password) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.confirm_password;
        return newErrors;
      });
    }
  };

  const handleIndustryChange = (option: SingleValue<IndustryOption>) => {
    if (option) {
      handleInputChange('industry', option.value);
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
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-6">
            Account Details
          </h2>

          {/* Account Name */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200 mb-2">
              Account Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.account_name}
              onChange={(e) => handleInputChange('account_name', e.target.value)}
              className={clsx(
                'w-full px-4 py-2.5 text-sm border rounded-lg transition-colors',
                'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100',
                'focus:outline-none focus:ring-2 focus:ring-primary',
                errors.account_name
                  ? 'border-red-500 dark:border-red-500'
                  : 'border-neutral-300 dark:border-neutral-700'
              )}
            />
            {errors.account_name && (
              <p className="mt-1 text-xs text-red-500">{errors.account_name}</p>
            )}
          </div>

          {/* Contact Phone */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200 mb-2">
              Contact Phone <span className="text-red-500">*</span>
            </label>
            <PhoneInput
              country="KE"
              international
              defaultCountry="KE"
              value={formData.contact_phone}
              onChange={(val) => handleInputChange('contact_phone', val || '')}
              className={clsx(
                'w-full text-sm text-neutral-900 dark:text-neutral-100 rounded',
                '[&_.PhoneInputInput]:w-full [&_.PhoneInputInput]:rounded-r-md',
                '[&_.PhoneInputInput]:px-3 [&_.PhoneInputInput]:py-2.5 [&_.PhoneInputInput]:bg-white dark:[&_.PhoneInputInput]:bg-neutral-900',
                '[&_.PhoneInputInput]:border-l',
                '[&_.PhoneInputInput]:focus:outline-none',
                '[&_.PhoneInput]:flex [&_.PhoneInput]:rounded-md [&_.PhoneInput]:border [&_.PhoneInput]:bg-white dark:[&_.PhoneInput]:bg-neutral-900',
                errors.contact_phone
                  ? '[&_.PhoneInputInput]:border-red-500 dark:[&_.PhoneInputInput]:border-red-500 [&_.PhoneInput]:border-red-500 dark:[&_.PhoneInput]:border-red-500'
                  : '[&_.PhoneInputInput]:border-neutral-300 dark:[&_.PhoneInputInput]:border-neutral-700 [&_.PhoneInput]:border-neutral-300 dark:[&_.PhoneInput]:border-neutral-700'
              )}
            />
            {errors.contact_phone && (
              <p className="mt-1 text-xs text-red-500">{errors.contact_phone}</p>
            )}
          </div>

          {/* Contact Email */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200 mb-2">
              Contact Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={formData.contact_email}
              onChange={(e) => handleInputChange('contact_email', e.target.value)}
              className={clsx(
                'w-full px-4 py-2.5 text-sm border rounded-lg transition-colors',
                'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100',
                'focus:outline-none focus:ring-2 focus:ring-primary',
                errors.contact_email
                  ? 'border-red-500 dark:border-red-500'
                  : 'border-neutral-300 dark:border-neutral-700'
              )}
            />
            {errors.contact_email && (
              <p className="mt-1 text-xs text-red-500">{errors.contact_email}</p>
            )}
          </div>

          {/* KRA PIN */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200 mb-2">
              KRA PIN
            </label>
            <input
              type="text"
              value={formData.kra_pin}
              onChange={(e) => handleInputChange('kra_pin', e.target.value.toUpperCase())}
              className={clsx(
                'w-full px-4 py-2.5 text-sm border rounded-lg transition-colors uppercase',
                'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100',
                'focus:outline-none focus:ring-2 focus:ring-primary',
                'border-neutral-300 dark:border-neutral-700'
              )}
            />
          </div>

          {/* Industry */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200 mb-2">
              Industry <span className="text-red-500">*</span>
            </label>
            <Select
              value={industryOptions.find((opt) => opt.value === formData.industry)}
              options={industryOptions}
              onChange={handleIndustryChange}
              className="text-sm"
              classNames={{
                control: ({ isFocused }) =>
                  clsx(
                    '!min-h-[42px] !text-sm transition-colors',
                    '!border !rounded-lg',
                    '!border-neutral-300 dark:!border-neutral-700',
                    '!bg-white dark:!bg-neutral-900',
                    'hover:!border-primary/60',
                    isFocused && '!border-primary/80 !ring-2 !ring-primary/30'
                  ),
                menu: () =>
                  clsx(
                    'dark:!bg-neutral-900 dark:!border-neutral-700',
                    '!border !border-neutral-300 dark:!border-neutral-700',
                    '!rounded-lg !shadow-lg !text-sm !mt-1 z-[999]'
                  ),
                menuList: () => '!p-1 dark:!text-neutral-100',
                option: ({ isFocused, isSelected }) =>
                  clsx(
                    '!px-3 !py-2 !text-sm !cursor-pointer',
                    'dark:!text-neutral-100',
                    isSelected
                      ? '!bg-primary/20 !text-primary dark:!bg-primary/30'
                      : isFocused
                      ? '!bg-neutral-100 dark:!bg-neutral-800'
                      : '!bg-transparent'
                  ),
                singleValue: () => '!text-neutral-900 dark:!text-neutral-100',
                placeholder: () => '!text-neutral-500 dark:!text-neutral-400',
                dropdownIndicator: () =>
                  '!text-neutral-500 dark:!text-neutral-400 hover:!text-primary',
              }}
            />
          </div>

          {/* Outlet Details Section */}
          <div className="pt-6 mt-6 border-t border-neutral-200 dark:border-neutral-700">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
              First Outlet Details
            </h3>

            {/* Outlet Name */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200 mb-2">
                Outlet Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.outlet_name}
                onChange={(e) => handleInputChange('outlet_name', e.target.value)}
                className={clsx(
                  'w-full px-4 py-2.5 text-sm border rounded-lg transition-colors',
                  'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100',
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
              <PhoneInput
                country="KE"
                international
                defaultCountry="KE"
                value={formData.outlet_phone}
                onChange={(val) => handleInputChange('outlet_phone', val || '')}
                className={clsx(
                  'w-full text-sm text-neutral-900 dark:text-neutral-100 rounded',
                  '[&_.PhoneInputInput]:w-full [&_.PhoneInputInput]:rounded-r-md',
                  '[&_.PhoneInputInput]:px-3 [&_.PhoneInputInput]:py-2.5 [&_.PhoneInputInput]:bg-white dark:[&_.PhoneInputInput]:bg-neutral-900',
                  '[&_.PhoneInputInput]:border-l',
                  '[&_.PhoneInputInput]:focus:outline-none',
                  '[&_.PhoneInput]:flex [&_.PhoneInput]:rounded-md [&_.PhoneInput]:border [&_.PhoneInput]:bg-white dark:[&_.PhoneInput]:bg-neutral-900',
                  errors.outlet_phone
                    ? '[&_.PhoneInputInput]:border-red-500 dark:[&_.PhoneInputInput]:border-red-500 [&_.PhoneInput]:border-red-500 dark:[&_.PhoneInput]:border-red-500'
                    : '[&_.PhoneInputInput]:border-neutral-300 dark:[&_.PhoneInputInput]:border-neutral-700 [&_.PhoneInput]:border-neutral-300 dark:[&_.PhoneInput]:border-neutral-700'
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
                className={clsx(
                  'w-full px-4 py-2.5 text-sm border rounded-lg transition-colors',
                  'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100',
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
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-6">
            Owner Profile
          </h2>

          {/* First Name */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200 mb-2">
              First Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.first_name}
              onChange={(e) => handleInputChange('first_name', e.target.value)}
              className={clsx(
                'w-full px-4 py-2.5 text-sm border rounded-lg transition-colors',
                'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100',
                'focus:outline-none focus:ring-2 focus:ring-primary',
                errors.first_name
                  ? 'border-red-500 dark:border-red-500'
                  : 'border-neutral-300 dark:border-neutral-700'
              )}
            />
            {errors.first_name && (
              <p className="mt-1 text-xs text-red-500">{errors.first_name}</p>
            )}
          </div>

          {/* Last Name */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200 mb-2">
              Last Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.last_name}
              onChange={(e) => handleInputChange('last_name', e.target.value)}
              className={clsx(
                'w-full px-4 py-2.5 text-sm border rounded-lg transition-colors',
                'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100',
                'focus:outline-none focus:ring-2 focus:ring-primary',
                errors.last_name
                  ? 'border-red-500 dark:border-red-500'
                  : 'border-neutral-300 dark:border-neutral-700'
              )}
            />
            {errors.last_name && (
              <p className="mt-1 text-xs text-red-500">{errors.last_name}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200 mb-2">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className={clsx(
                'w-full px-4 py-2.5 text-sm border rounded-lg transition-colors',
                'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100',
                'focus:outline-none focus:ring-2 focus:ring-primary',
                errors.email
                  ? 'border-red-500 dark:border-red-500'
                  : 'border-neutral-300 dark:border-neutral-700'
              )}
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-500">{errors.email}</p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200 mb-2">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <PhoneInput
              country="KE"
              international
              defaultCountry="KE"
              value={formData.phone}
              onChange={(val) => handleInputChange('phone', val || '')}
              className={clsx(
                'w-full text-sm text-neutral-900 dark:text-neutral-100 rounded',
                '[&_.PhoneInputInput]:w-full [&_.PhoneInputInput]:rounded-r-md',
                '[&_.PhoneInputInput]:px-3 [&_.PhoneInputInput]:py-2.5 [&_.PhoneInputInput]:bg-white dark:[&_.PhoneInputInput]:bg-neutral-900',
                '[&_.PhoneInputInput]:border-l',
                '[&_.PhoneInputInput]:focus:outline-none',
                '[&_.PhoneInput]:flex [&_.PhoneInput]:rounded-md [&_.PhoneInput]:border [&_.PhoneInput]:bg-white dark:[&_.PhoneInput]:bg-neutral-900',
                errors.phone
                  ? '[&_.PhoneInputInput]:border-red-500 dark:[&_.PhoneInputInput]:border-red-500 [&_.PhoneInput]:border-red-500 dark:[&_.PhoneInput]:border-red-500'
                  : '[&_.PhoneInputInput]:border-neutral-300 dark:[&_.PhoneInputInput]:border-neutral-700 [&_.PhoneInput]:border-neutral-300 dark:[&_.PhoneInput]:border-neutral-700'
              )}
            />
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
                className={clsx(
                  'w-full px-4 py-2.5 pr-10 text-sm border rounded-lg transition-colors',
                  'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100',
                  'focus:outline-none focus:ring-2 focus:ring-primary',
                  errors.password
                    ? 'border-red-500 dark:border-red-500'
                    : 'border-neutral-300 dark:border-neutral-700'
                )}
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
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200 mb-2">
              Confirm Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => handleConfirmPasswordChange(e.target.value)}
                className={clsx(
                  'w-full px-4 py-2.5 pr-10 text-sm border rounded-lg transition-colors',
                  'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100',
                  'focus:outline-none focus:ring-2 focus:ring-primary',
                  errors.confirm_password
                    ? 'border-red-500 dark:border-red-500'
                    : 'border-neutral-300 dark:border-neutral-700'
                )}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
              >
                {showConfirmPassword ? (
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
            {errors.confirm_password && (
              <p className="mt-1 text-xs text-red-500">{errors.confirm_password}</p>
            )}
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
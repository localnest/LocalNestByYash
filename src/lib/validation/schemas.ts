import { z } from 'zod';

/**
 * Standard Indian Phone regex: 10 digits starting with 6-9
 */
const INDIAN_PHONE_REGEX = /^[6-9]\d{9}$/;

/**
 * Standard Indian IFSC regex: 4 letters + 0 + 6 alphanumeric
 */
const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;

/**
 * Standard Indian PAN regex: 5 uppercase letters + 4 digits + 1 uppercase letter
 */
const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

export const residentOnboardingSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().regex(INDIAN_PHONE_REGEX, 'Must be a valid 10-digit Indian phone number'),
  tower: z.string().min(1, 'Please specify your building or tower'),
  flatNumber: z.string().min(1, 'Please specify your flat/door number'),
  societyId: z.string().min(1, 'Please select your society'),
});

export const providerOnboardingSchema = z.object({
  businessName: z.string().min(3, 'Business or trade name must be at least 3 characters'),
  phone: z.string().regex(INDIAN_PHONE_REGEX, 'Must be a valid 10-digit Indian phone number'),
  panNumber: z
    .string()
    .regex(PAN_REGEX, 'Must be a valid 10-character PAN number (e.g. ABCDE1234F)'),
  experienceYears: z.number().min(0).max(50, 'Experience years must be between 0 and 50'),
  coverageRadiusKm: z.number().min(1).max(25, 'Radius must be between 1 and 25 km'),
  enabledTaskIds: z.array(z.string()).min(1, 'Please select at least one service task you perform'),
});

export const bankVerificationSchema = z
  .object({
    accountNumber: z.string().regex(/^\d{9,18}$/, 'Account number must be 9 to 18 digits'),
    confirmAccountNumber: z.string(),
    ifsc: z.string().regex(IFSC_REGEX, 'Invalid IFSC code (e.g. HDFC0001234)'),
    beneficiaryName: z.string().min(2, 'Beneficiary name must be at least 2 characters'),
  })
  .refine((data) => data.accountNumber === data.confirmAccountNumber, {
    message: 'Account numbers do not match',
    path: ['confirmAccountNumber'],
  });

export const bookingFormSchema = z.object({
  serviceId: z.string().min(1, 'Service selection is required'),
  selectedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted YYYY-MM-DD'),
  selectedSlot: z.string().min(1, 'Please choose a time slot'),
  taskIds: z.array(z.string()).min(1, 'Please select at least one task or service tier'),
  notes: z.string().max(300, 'Notes cannot exceed 300 characters').optional(),
});

export const complaintFormSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
  category: z.string().min(1, 'Please select a complaint category'),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL_SAFETY']),
  description: z.string().min(10, 'Please provide at least 10 characters describing the issue'),
});

/**
 * Generic type-safe validator helper returning clean error maps.
 */
export function validateForm<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
): { success: true; data: T } | { success: false; errors: Record<string, string> } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = issue.path.join('.') || 'form';
    if (!errors[key]) {
      errors[key] = issue.message;
    }
  }

  return { success: false, errors };
}

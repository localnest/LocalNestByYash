export interface GstTaxBreakdown {
  taxableAmount: number;
  cgstRate: number; // e.g. 0.09 (9%)
  cgstAmount: number;
  sgstRate: number; // e.g. 0.09 (9%)
  sgstAmount: number;
  igstRate: number; // e.g. 0.18 (18%)
  igstAmount: number;
  totalTax: number;
  totalInvoiceAmount: number;
}

export interface GstInvoice {
  invoiceNumber: string;
  orderId: string;
  date: string;
  sacCode: string;
  serviceDescription: string;
  providerGstin?: string;
  customerGstin?: string;
  placeOfSupply: string; // e.g. "27-Maharashtra"
  isIntraState: boolean;
  taxes: GstTaxBreakdown;
}

/**
 * Standard SAC codes under Indian GST for society hyperlocal services.
 */
export const SAC_CODES = {
  HOME_REPAIRS: '9987',
  LAUNDRY_CLEANING: '9997',
  TIFFIN_CATERING: '9963',
  SALON_GROOMING: '9997',
  CAR_WASH: '9987',
  DEFAULT: '9983',
} as const;

/**
 * Generates an Indian GST compliant invoice breakdown for a completed order.
 * - Intra-state (same state code, e.g. 27): 9% CGST + 9% SGST.
 * - Inter-state (different state): 18% IGST.
 */
export function generateGstInvoice(
  orderId: string,
  grossAmount: number,
  categoryName: string,
  providerStateCode = '27', // 27 = Maharashtra
  customerStateCode = '27',
  providerGstin?: string,
  customerGstin?: string,
): GstInvoice {
  const isIntraState = providerStateCode === customerStateCode;

  // Base taxable value (assuming inclusive 18% GST standard)
  const taxableAmount = Math.round((grossAmount / 1.18) * 100) / 100;
  const totalTax = Math.round((grossAmount - taxableAmount) * 100) / 100;

  let taxes: GstTaxBreakdown;

  if (isIntraState) {
    const halfTax = Math.round((totalTax / 2) * 100) / 100;
    taxes = {
      taxableAmount,
      cgstRate: 0.09,
      cgstAmount: halfTax,
      sgstRate: 0.09,
      sgstAmount: halfTax,
      igstRate: 0,
      igstAmount: 0,
      totalTax,
      totalInvoiceAmount: grossAmount,
    };
  } else {
    taxes = {
      taxableAmount,
      cgstRate: 0,
      cgstAmount: 0,
      sgstRate: 0,
      sgstAmount: 0,
      igstRate: 0.18,
      igstAmount: totalTax,
      totalTax,
      totalInvoiceAmount: grossAmount,
    };
  }

  const categoryUpper = categoryName.toUpperCase();
  let sacCode: string = SAC_CODES.DEFAULT;
  if (categoryUpper.includes('LAUNDRY')) sacCode = SAC_CODES.LAUNDRY_CLEANING;
  else if (categoryUpper.includes('TIFFIN') || categoryUpper.includes('MEAL'))
    sacCode = SAC_CODES.TIFFIN_CATERING;
  else if (categoryUpper.includes('REPAIR') || categoryUpper.includes('PLUMB'))
    sacCode = SAC_CODES.HOME_REPAIRS;
  else if (categoryUpper.includes('SALON')) sacCode = SAC_CODES.SALON_GROOMING;

  const invoiceNumber = `INV-${new Date().getFullYear()}-${orderId.slice(0, 8).toUpperCase()}`;

  return {
    invoiceNumber,
    orderId,
    date: new Date().toISOString(),
    sacCode,
    serviceDescription: `Hyperlocal Society Service: ${categoryName}`,
    providerGstin: providerGstin || '27AABCL1234F1Z1',
    customerGstin,
    placeOfSupply: `${customerStateCode}-IN`,
    isIntraState,
    taxes,
  };
}

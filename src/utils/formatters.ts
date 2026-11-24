import { format, parseISO, isValid } from 'date-fns';

export function formatCurrency(amount: number, symbol = '₹'): string {
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  return `${symbol} ${safeAmount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatDate(dateString?: string | null, formatStr = 'dd/MM/yyyy'): string {
  if (!dateString) return '-';
  try {
    const parsed = typeof dateString === 'string' ? parseISO(dateString) : new Date(dateString);
    if (!isValid(parsed)) {
      // Try standard Date constructor
      const d = new Date(dateString);
      return isValid(d) ? format(d, formatStr) : dateString;
    }
    return format(parsed, formatStr);
  } catch {
    return dateString || '-';
  }
}

export function formatDateTime(dateString?: string | null): string {
  return formatDate(dateString, 'dd/MM/yyyy hh:mm a');
}

export function getTodayDateString(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

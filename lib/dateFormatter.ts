/**
 * Date Formatter Utility - Thai Format (dd/mm/yyyy)
 * Centralized date formatting for the entire Micro-Account application
 */

/**
 * Format date for display in Thai format (dd/mm/yyyy)
 * @param date - Date object or ISO string
 * @param options - Formatting options (includeTime, formatLong, formatShort)
 * @returns Formatted string in dd/mm/yyyy or dd/mm/yyyy HH:mm format
 */
export function formatDateDisplay(
  date: Date | string | null | undefined,
  options?: { includeTime?: boolean; formatLong?: boolean; formatShort?: boolean } | boolean
): string {
  // Handle legacy boolean parameter
  const opts = typeof options === 'boolean' ? { includeTime: options } : (options || {});
  const includeTime = opts.includeTime || false;
  if (!date) return '-';

  const d = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(d.getTime())) return '-';

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();

  if (includeTime) {
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  }

  return `${day}/${month}/${year}`;
}

/**
 * Format date for HTML5 date input (yyyy-MM-dd)
 * @param date - Date object or ISO string
 * @returns Formatted string in yyyy-MM-dd format
 */
export function formatDateInput(date: Date | string | null | undefined): string {
  if (!date) return '';

  const d = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(d.getTime())) return '';

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * Format date with Thai month name (e.g., "15 มกราคม 2569")
 * @param date - Date object or ISO string
 * @param useBuddhistYear - Whether to convert to Buddhist year (default: true for Thai context)
 * @returns Formatted string with Thai month name
 */
export function formatDateWithThaiMonth(date: Date | string | null | undefined, useBuddhistYear: boolean = true): string {
  if (!date) return '-';

  const d = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(d.getTime())) return '-';

  const thaiMonths = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];

  const day = d.getDate();
  const month = thaiMonths[d.getMonth()];
  const year = useBuddhistYear ? d.getFullYear() + 543 : d.getFullYear();

  return `${day} ${month} ${year}`;
}

/**
 * Format date for API/database storage (ISO string)
 * @param date - Date object or string
 * @returns ISO string format (yyyy-MM-ddT00:00:00Z)
 */
export function formatDateISO(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().split('T')[0];
}

/**
 * Parse dd/mm/yyyy string to Date object
 * @param dateString - Date string in dd/mm/yyyy format
 * @returns Date object or null if invalid
 */
export function parseDateDisplay(dateString: string): Date | null {
  const parts = dateString.split('/');
  if (parts.length !== 3) return null;

  const [day, month, year] = parts.map(p => parseInt(p, 10));

  if (isNaN(day) || isNaN(month) || isNaN(year)) return null;

  const date = new Date(year, month - 1, day);

  if (date.getDate() !== day || date.getMonth() !== month - 1) {
    return null; // Invalid date (e.g., 31/02/2026)
  }

  return date;
}

/**
 * Get current date in dd/mm/yyyy format
 * @returns Current date formatted as dd/mm/yyyy
 */
export function getCurrentDateDisplay(): string {
  return formatDateDisplay(new Date());
}

/**
 * Get current date for HTML5 date input
 * @returns Current date formatted as yyyy-MM-dd
 */
export function getCurrentDateInput(): string {
  return formatDateInput(new Date());
}

/**
 * Toast Notification Utility
 * 
 * Provides a simple console-based toast notification system.
 * This can be upgraded to use react-hot-toast or another UI library later.
 * 
 * Usage:
 *   const id = showToast.success('Operation successful!');
 *   showToast.error('Something went wrong');
 *   showToast.dismiss(id);
 */

// Simple in-memory storage for toast IDs
let toastIdCounter = 0;
const activeToasts = new Set<string>();

/**
 * Generate a unique toast ID
 */
function generateId(): string {
  toastIdCounter++;
  return `toast-${toastIdCounter}-${Date.now()}`;
}

/**
 * Log a toast message to console
 */
function logToast(type: string, message: string, id: string): void {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [TOAST:${type}] [${id}]`;
  
  switch (type) {
    case 'success':
      console.log(`✓ ${prefix} ${message}`);
      break;
    case 'error':
      console.error(`✗ ${prefix} ${message}`);
      break;
    case 'warning':
      console.warn(`⚠ ${prefix} ${message}`);
      break;
    case 'info':
      console.info(`ℹ ${prefix} ${message}`);
      break;
    case 'loading':
      console.log(`⏳ ${prefix} ${message}`);
      break;
    default:
      console.log(`${prefix} ${message}`);
  }
}

/**
 * Show a success toast notification
 * 
 * @param message - The success message to display
 * @returns The toast ID for dismissal
 */
function success(message: string): string {
  const id = generateId();
  activeToasts.add(id);
  logToast('success', message, id);
  return id;
}

/**
 * Show an error toast notification
 * 
 * @param message - The error message to display
 * @returns The toast ID for dismissal
 */
function error(message: string): string {
  const id = generateId();
  activeToasts.add(id);
  logToast('error', message, id);
  return id;
}

/**
 * Show an info toast notification
 * 
 * @param message - The info message to display
 * @returns The toast ID for dismissal
 */
function info(message: string): string {
  const id = generateId();
  activeToasts.add(id);
  logToast('info', message, id);
  return id;
}

/**
 * Show a warning toast notification
 * 
 * @param message - The warning message to display
 * @returns The toast ID for dismissal
 */
function warning(message: string): string {
  const id = generateId();
  activeToasts.add(id);
  logToast('warning', message, id);
  return id;
}

/**
 * Show a loading toast notification
 * 
 * @param message - The loading message to display
 * @returns The toast ID for dismissal
 */
function loading(message: string): string {
  const id = generateId();
  activeToasts.add(id);
  logToast('loading', message, id);
  return id;
}

/**
 * Dismiss a toast notification
 * 
 * @param id - The toast ID to dismiss
 */
function dismiss(id: string): void {
  if (activeToasts.has(id)) {
    activeToasts.delete(id);
    console.log(`[TOAST] Dismissed: ${id}`);
  }
}

/**
 * Toast notification API
 */
export const showToast = {
  success,
  error,
  info,
  warning,
  loading,
  dismiss,
};

export default showToast;

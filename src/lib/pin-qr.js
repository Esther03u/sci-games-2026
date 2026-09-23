import QRCode from 'qrcode';

// QR for a referee PIN: opens /staff/login with the sport preselected.
// Colours must be hex — the qrcode library rejects CSS variables (a theme
// codemod once turned `dark` into 'var(--text)', which threw and silently
// hid the QR). Black on white also scans best in either site theme.
export const PIN_QR_OPTIONS = { width: 220, margin: 1, color: { dark: '#000000', light: '#ffffff' } };

/** @returns {Promise<string>} data: URL of a PNG */
export function pinLoginQr(loginUrl) {
  return QRCode.toDataURL(loginUrl, PIN_QR_OPTIONS);
}

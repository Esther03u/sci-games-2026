import QRCode from 'qrcode';

export const MC_QR_OPTIONS = {
  width: 260,
  margin: 1,
  color: { dark: '#000000', light: '#ffffff' },
};

/**
 * Generates a high-contrast data:image/png QR code for the MC stage teleprompter.
 * @param {string} url - Target URL e.g. https://domain/mc
 * @returns {Promise<string>}
 */
export async function generateMcQr(url = '/mc') {
  return QRCode.toDataURL(url, MC_QR_OPTIONS);
}

import QRCode from 'qrcode';

export const TICKET_THEMES = {
  charcoal: { 
    id: 'charcoal', 
    name: 'Stealth Charcoal', 
    primary: '#1e293b', 
    hex: '#1e293b', 
    refColor: '#38bdf8' 
  },
  crimson: { 
    id: 'crimson', 
    name: 'Muted Crimson', 
    primary: '#881337', 
    hex: '#881337', 
    refColor: '#f43f5e' 
  },
  navy: { 
    id: 'navy', 
    name: 'Midnight Navy', 
    primary: '#172554', 
    hex: '#172554', 
    refColor: '#60a5fa' 
  },
  pine: { 
    id: 'pine', 
    name: 'Deep Pine', 
    primary: '#14532d', 
    hex: '#14532d', 
    refColor: '#34d399' 
  },
  espresso: { 
    id: 'espresso', 
    name: 'Warm Mocha', 
    primary: '#451a03', 
    hex: '#451a03', 
    refColor: '#fbbf24' 
  },
};

/**
 * Generates a high-resolution BookMyShow-style ticket image on an HTML5 canvas.
 * Perfectly calibrated with matte, non-glare, dark-mode adaptive colors.
 */
export async function createTicketCanvas({
  reference = 'BS-VIP999',
  itemName = 'Arena Experience',
  date = '2026-09-28',
  timeSlot = '18:00',
  players = 4,
  guestName = 'Arena Challenger',
  amount = '₹1,596',
  isPaid = true,
  theme = 'charcoal',
  payMode = 'full',
  paidAmount = '₹1,596',
  balanceDue = '₹0',
}) {
  const currentTheme = TICKET_THEMES[theme] || TICKET_THEMES.charcoal;
  const isDark = typeof document !== 'undefined' ? document.documentElement.getAttribute('data-theme') !== 'light' : true;

  const width = 800;
  const height = 1120;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // Palette settings based on dark/light aesthetic (zero glaring brightness)
  const outerBg = isDark ? '#090a0f' : '#f1f5f9';
  const cardBg = isDark ? '#13151f' : '#ffffff';
  const cardBorder = isDark ? '#262a3b' : '#e2e8f0';
  const textTitle = isDark ? '#f1f5f9' : '#0f172a';
  const boxBg = isDark ? '#1a1d2a' : '#f8fafc';
  const boxBorder = isDark ? '#262a3b' : '#e2e8f0';
  const labelColor = isDark ? '#8892a4' : '#64748b';
  const valueColor = isDark ? '#f8fafc' : '#0f172a';
  const dashedColor = isDark ? '#2d3246' : '#cbd5e1';
  const notchColor = outerBg;

  // Outer Margin Background
  ctx.fillStyle = outerBg;
  ctx.fillRect(0, 0, width, height);

  // Main Ticket Card Body (Matte, non-glaring)
  const cardX = 36;
  const cardY = 36;
  const cardW = width - 72;
  const cardH = height - 72;
  const cardRadius = 20;

  ctx.fillStyle = cardBg;
  roundRect(ctx, cardX, cardY, cardW, cardH, cardRadius);
  ctx.fill();

  // Subtle clean card border
  ctx.strokeStyle = cardBorder;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Top Header Banner (Chosen Theme Color, solid matte, zero neon glare)
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(cardX + cardRadius, cardY);
  ctx.lineTo(cardX + cardW - cardRadius, cardY);
  ctx.quadraticCurveTo(cardX + cardW, cardY, cardX + cardW, cardY + cardRadius);
  ctx.lineTo(cardX + cardW, cardY + 110);
  ctx.lineTo(cardX, cardY + 110);
  ctx.lineTo(cardX, cardY + cardRadius);
  ctx.quadraticCurveTo(cardX, cardY, cardX + cardRadius, cardY);
  ctx.closePath();
  ctx.fillStyle = currentTheme.primary;
  ctx.fill();
  ctx.restore();

  // Header Text
  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('BATTLESHIP ARENA • OFFICIAL BOARDING PASS', cardX + 32, cardY + 42);

  ctx.font = '800 28px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('BATTLESHIP ARENA', cardX + 32, cardY + 76);

  ctx.font = '500 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = 'rgba(248, 250, 252, 0.85)';
  ctx.fillText('Level 4, Nexus Mall, Hyderabad • Fast-Track Admission', cardX + 32, cardY + 98);

  // Experience Title (Bold, High Contrast, Clean)
  ctx.fillStyle = textTitle;
  ctx.font = '800 30px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  const truncatedTitle = itemName.length > 30 ? itemName.slice(0, 28) + '...' : itemName;
  ctx.fillText(truncatedTitle, cardX + 32, cardY + 165);

  // Status Badge (Calm, muted tones)
  if (payMode === 'advance') {
    ctx.fillStyle = isDark ? 'rgba(56, 189, 248, 0.16)' : '#f0f9ff';
    roundRect(ctx, cardX + 32, cardY + 185, 330, 34, 8);
    ctx.fill();
    ctx.strokeStyle = isDark ? 'rgba(56, 189, 248, 0.4)' : '#bae6fd';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = isDark ? '#38bdf8' : '#0284c7';
    ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText('✓ ADVANCE TOKEN PAID • SLOT SECURED', cardX + 46, cardY + 207);
  } else {
    ctx.fillStyle = isDark ? 'rgba(16, 185, 129, 0.16)' : '#ecfdf5';
    roundRect(ctx, cardX + 32, cardY + 185, 290, 34, 8);
    ctx.fill();
    ctx.strokeStyle = isDark ? 'rgba(16, 185, 129, 0.4)' : '#a7f3d0';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = isDark ? '#34d399' : '#047857';
    ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText('✓ 100% PAID IN FULL (RAZORPAY)', cardX + 46, cardY + 207);
  }

  // 4 Meta Detail Cards
  const metaCards = [
    { label: 'DATE', value: date },
    { label: 'ARRIVAL TIME', value: timeSlot },
    { label: 'SQUAD SIZE', value: `${players} Players` },
    { label: 'BOOKED BY', value: guestName.slice(0, 18) || 'Guest' },
  ];

  const colW = (cardW - 64 - 20) / 2;
  const rowH = 80;
  metaCards.forEach((card, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const x = cardX + 32 + col * (colW + 20);
    const y = cardY + 245 + row * (rowH + 16);

    ctx.fillStyle = boxBg;
    roundRect(ctx, x, y, colW, rowH, 12);
    ctx.fill();
    ctx.strokeStyle = boxBorder;
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = labelColor;
    ctx.font = '700 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(card.label, x + 16, y + 28);

    ctx.fillStyle = valueColor;
    ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(card.value, x + 16, y + 58);
  });

  // Perforated Cut Line
  const cutY = cardY + 465;
  ctx.save();
  ctx.setLineDash([8, 8]);
  ctx.strokeStyle = dashedColor;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cardX + 24, cutY);
  ctx.lineTo(cardX + cardW - 24, cutY);
  ctx.stroke();
  ctx.restore();

  // Semicircular Ticket Cutout Notches on Left and Right borders
  ctx.fillStyle = notchColor;
  ctx.beginPath();
  ctx.arc(cardX, cutY, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = cardBorder;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(cardX + cardW, cutY, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = cardBorder;
  ctx.stroke();

  // Bottom Stub Container
  const stubY = cutY + 36;

  // Generate QR Code onto an offscreen canvas
  try {
    const qrCanvas = document.createElement('canvas');
    await QRCode.toCanvas(qrCanvas, `https://battleship.arena/verify?ref=${encodeURIComponent(reference)}`, {
      width: 200,
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    });

    // White backing box with clean border for the QR code
    ctx.fillStyle = '#ffffff';
    roundRect(ctx, cardX + 32, stubY, 220, 220, 12);
    ctx.fill();
    ctx.strokeStyle = isDark ? '#33384c' : '#e2e8f0';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Draw the QR
    ctx.drawImage(qrCanvas, cardX + 42, stubY + 10, 200, 200);
  } catch (err) {
    console.warn('QR Code generation fallback:', err);
    ctx.fillStyle = boxBg;
    roundRect(ctx, cardX + 32, stubY, 220, 220, 12);
    ctx.fill();
    ctx.strokeStyle = boxBorder;
    ctx.stroke();
    ctx.fillStyle = textTitle;
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('PASS CODE', cardX + 142, stubY + 95);
    ctx.font = 'bold 20px monospace';
    ctx.fillText(reference, cardX + 142, stubY + 125);
    ctx.textAlign = 'left';
  }

  // Right Side of Stub: Pass Info
  const textX = cardX + 285;

  ctx.fillStyle = labelColor;
  ctx.font = '700 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('BOOKING REFERENCE', textX, stubY + 30);

  ctx.fillStyle = currentTheme.refColor;
  ctx.font = '900 32px monospace';
  ctx.fillText(`#${reference}`, textX, stubY + 68);

  ctx.fillStyle = labelColor;
  ctx.font = '700 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(payMode === 'advance' ? 'PAYMENT (TOKEN ADVANCE)' : 'PAYMENT (100% PAID)', textX, stubY + 115);

  if (payMode === 'advance') {
    ctx.fillStyle = isDark ? '#38bdf8' : '#0284c7';
    ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(`Advance Paid: ${paidAmount}`, textX, stubY + 142);

    ctx.fillStyle = isDark ? '#fbbf24' : '#b45309';
    ctx.font = '700 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(`Due at Venue: ${balanceDue}`, textX, stubY + 166);
  } else {
    ctx.fillStyle = valueColor;
    ctx.font = 'bold 26px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(amount, textX, stubY + 148);
  }

  ctx.fillStyle = labelColor;
  ctx.font = '700 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('RESERVATION STATUS', textX, stubY + 195);

  ctx.fillStyle = isDark ? '#34d399' : '#047857';
  ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(payMode === 'advance' ? '✓ Slot Secured · Wristband on Counter' : '✓ Full Paid · Fast-Track Entry', textX, stubY + 220);

  // Footer Instructions (Clean, subtle, centered)
  ctx.fillStyle = isDark ? '#717b8f' : '#94a3b8';
  ctx.font = '500 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Show this pass QR code at the Level 4 reception desk for wristband check-in.', width / 2, cardY + cardH - 50);
  ctx.fillText('Customer Support: +91 86765 75675 • support@battleshiparena.com', width / 2, cardY + cardH - 28);
  ctx.textAlign = 'left';

  return canvas;
}

/**
 * Returns data URL preview for displaying the generated ticket directly in React.
 */
export async function getTicketPreviewDataUrl(ticketData) {
  const canvas = await createTicketCanvas(ticketData);
  return canvas.toDataURL('image/png');
}

/**
 * Utility to draw rounded rectangles on HTML5 canvas
 */
function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

/**
 * Converts the canvas to a File object for the Web Share API.
 */
export async function getTicketImageBlob(canvas) {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/png', 0.95);
  });
}

/**
 * Downloads the BookMyShow style ticket as a PNG image.
 */
export async function downloadTicketImage(ticketData) {
  const canvas = await createTicketCanvas(ticketData);
  const dataUrl = canvas.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = `battleship-boarding-pass-${ticketData.reference || 'VIP'}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/**
 * Shares the ticket image and details on WhatsApp like BookMyShow!
 */
export async function shareTicketOnWhatsApp(ticketData) {
  const canvas = await createTicketCanvas(ticketData);
  const blob = await getTicketImageBlob(canvas);
  const fileName = `battleship-pass-${ticketData.reference}.png`;
  const file = new File([blob], fileName, { type: 'image/png' });

  const shareText = 
    `🎮 *BATTLESHIP ARENA — OFFICIAL VIP BOARDING PASS*\n\n` +
    `🎟️ *Pass Ref:* #${ticketData.reference}\n` +
    `⚔️ *Experience:* ${ticketData.itemName}\n` +
    `📅 *Date:* ${ticketData.date}\n` +
    `⏰ *Slot:* ${ticketData.timeSlot}\n` +
    `👥 *Squad:* ${ticketData.players} Players\n` +
    `💳 *Payment:* ${ticketData.payMode === 'advance' ? `Advance Token Paid (${ticketData.paidAmount}) • Due at Venue (${ticketData.balanceDue})` : `100% Paid in Full (${ticketData.amount})`}\n` +
    `📍 *Venue:* Battleship Arena, Level 4 Nexus Mall, Hyderabad\n\n` +
    `👉 Be ready! Show this digital ticket pass at the counter for fast-track entry.`;

  // 1. Try Native Web Share API with image file attachment (Works on mobile Chrome/Safari/WhatsApp)
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        title: `Battleship Arena Pass - #${ticketData.reference}`,
        text: shareText,
        files: [file],
      });
      return { shared: true, method: 'native' };
    } catch (err) {
      if (err.name === 'AbortError') return { shared: false, cancelled: true };
    }
  }

  // 2. Desktop / Fallback: Download the high-res ticket image file AND open WhatsApp
  const dataUrl = canvas.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  // Open WhatsApp with formatted caption
  const waUrl = `https://wa.me/?text=${encodeURIComponent(
    shareText + `\n\n(📎 Ticket pass image downloaded to your device — attach it directly to this chat!)`
  )}`;
  window.open(waUrl, '_blank', 'noopener,noreferrer');

  return { shared: true, method: 'download_and_whatsapp' };
}

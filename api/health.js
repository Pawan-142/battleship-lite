import { razorpayConfigured, getKeyId } from './_shared/razorpay.js';

export default function handler(req, res) {
  res.json({
    ok: true,
    razorpayConfigured: razorpayConfigured(),
    keyId: getKeyId(),
    time: new Date().toISOString(),
  });
}

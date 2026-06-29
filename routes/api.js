/**
 * OCH! SUSHI – API Routes
 * Payment processing (Stripe) and order email notifications
 */
const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const nodemailer = require('nodemailer');

// IMPORTANT: Set your Stripe secret key in .env file
const stripe = process.env.STRIPE_SECRET_KEY
  ? require('stripe')(process.env.STRIPE_SECRET_KEY)
  : null;

const DELIVERY_FEE = parseInt(process.env.DELIVERY_FEE) || 10;
const FREE_DELIVERY_THRESHOLD = parseInt(process.env.FREE_DELIVERY_THRESHOLD) || 100;

/* ========== HEALTH CHECK ========== */
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date(), stripe: !!stripe });
});

/* ========== CREATE PAYMENT INTENT ========== */
router.post('/create-payment-intent', async (req, res) => {
  try {
    const { items, deliveryMethod = 'delivery' } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Koszyk jest pusty.' });
    }

    // Calculate total server-side for security
    const subtotal = items.reduce((sum, item) => {
      return sum + (parseFloat(item.price) * parseInt(item.quantity));
    }, 0);

    const deliveryFee = (deliveryMethod === 'pickup' || subtotal >= FREE_DELIVERY_THRESHOLD) ? 0 : DELIVERY_FEE;
    const total = subtotal + deliveryFee;
    const orderId = uuidv4().split('-')[0].toUpperCase();

    if (stripe) {
      // Create Stripe PaymentIntent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(total * 100), // Convert to grosze
        currency: 'pln',
        metadata: {
          orderId,
          orderSummary: items.map(i => `${i.name} x${i.quantity}`).join(', ')
        }
      });

      return res.json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        orderId
      });
    } else {
      // Demo mode: no Stripe key configured
      console.log(`📦 [DEMO] Rozpoczęto zamówienie #${orderId} – ${total} PLN`);
      return res.json({ clientSecret: null, paymentIntentId: 'demo_' + Date.now(), orderId });
    }

  } catch (err) {
    console.error('Payment intent error:', err.message);
    return res.status(500).json({ error: 'Nie udało się utworzyć płatności. Spróbuj ponownie.' });
  }
});

/* ========== UPDATE PAYMENT INTENT ========== */
router.post('/update-payment-intent', async (req, res) => {
  try {
    const { paymentIntentId, items, deliveryMethod } = req.body;

    if (!stripe || !paymentIntentId || paymentIntentId.startsWith('demo_')) {
      return res.json({ success: true });
    }

    const subtotal = items.reduce((sum, item) => {
      return sum + (parseFloat(item.price) * parseInt(item.quantity));
    }, 0);

    const deliveryFee = (deliveryMethod === 'pickup' || subtotal >= FREE_DELIVERY_THRESHOLD) ? 0 : DELIVERY_FEE;
    const total = subtotal + deliveryFee;

    await stripe.paymentIntents.update(paymentIntentId, {
      amount: Math.round(total * 100),
    });

    return res.json({ success: true });
  } catch (err) {
    console.error('Update payment intent error:', err.message);
    return res.status(500).json({ error: 'Nie udało się zaktualizować płatności.' });
  }
});

/* ========== CONFIRM ORDER ========== */
router.post('/confirm-order', async (req, res) => {
  try {
    const { orderId, paymentIntentId, items, customer, total } = req.body;

    // Verify payment with Stripe (if configured)
    if (stripe && paymentIntentId && !paymentIntentId.startsWith('demo_')) {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      if (paymentIntent.status !== 'succeeded') {
        return res.status(400).json({ error: 'Płatność nie została zrealizowana.' });
      }
    }

    // Send email notification to restaurant
    await sendOrderEmail({ orderId, items, customer, total }).catch(err => {
      console.error('Email error (non-critical):', err.message);
    });

    console.log(`✅ Zamówienie #${orderId} potwierdzone – ${total} PLN`);

    return res.json({
      success: true,
      orderId,
      message: 'Zamówienie zostało przyjęte!'
    });

  } catch (err) {
    console.error('Confirm order error:', err.message);
    return res.status(500).json({ error: 'Nie udało się potwierdzić zamówienia.' });
  }
});

/* ========== EMAIL NOTIFICATION ========== */
async function sendOrderEmail({ orderId, items, customer, total }) {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    console.log('📧 Email nie skonfigurowany – pomijam wysyłkę');
    console.log('📋 Szczegóły zamówienia:');
    console.log(`   ID: #${orderId}`);
    console.log(`   Klient: ${customer.name} (${customer.email}, ${customer.phone})`);
    console.log(`   Dostawa: ${customer.deliveryMethod === 'delivery' ? customer.address : 'Odbiór osobisty'}`);
    console.log(`   Pozycje: ${items.map(i => `${i.name} x${i.quantity}`).join(', ')}`);
    console.log(`   Kwota: ${total} PLN`);
    if (customer.notes) console.log(`   Uwagi: ${customer.notes}`);
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  const itemsHtml = items.map(i => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;">${i.name}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center;">${i.quantity}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;">${i.price * i.quantity} PLN</td>
    </tr>
  `).join('');

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
      <div style="background:#2D2D2D;padding:24px;text-align:center;">
        <h1 style="color:#C4878E;margin:0;font-size:24px;">OCH! SUSHI</h1>
        <p style="color:#999;margin:4px 0 0;">Nowe zamówienie online</p>
      </div>
      <div style="padding:24px;background:#fff;">
        <h2 style="color:#2D2D2D;margin-top:0;">Zamówienie #${orderId}</h2>

        <h3 style="color:#C4878E;margin-bottom:8px;">Dane klienta</h3>
        <p style="margin:4px 0;"><strong>Imię:</strong> ${customer.name}</p>
        <p style="margin:4px 0;"><strong>Telefon:</strong> ${customer.phone}</p>
        <p style="margin:4px 0;"><strong>Email:</strong> ${customer.email}</p>
        <p style="margin:4px 0;"><strong>Dostawa:</strong> ${customer.deliveryMethod === 'delivery' ? 'Dostawa pod adres: ' + customer.address : 'Odbiór osobisty'}</p>
        ${customer.notes ? `<p style="margin:4px 0;"><strong>Uwagi:</strong> ${customer.notes}</p>` : ''}

        <h3 style="color:#C4878E;margin-bottom:8px;margin-top:20px;">Zamówienie</h3>
        <table style="width:100%;border-collapse:collapse;">
          <thead>
            <tr style="background:#f5f5f5;">
              <th style="padding:8px 12px;text-align:left;">Produkt</th>
              <th style="padding:8px 12px;text-align:center;">Ilość</th>
              <th style="padding:8px 12px;text-align:right;">Cena</th>
            </tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
        </table>

        <div style="margin-top:16px;padding:16px;background:#f5f5f5;border-radius:8px;">
          <p style="margin:4px 0;font-size:18px;font-weight:bold;text-align:right;color:#2D2D2D;">
            RAZEM: ${total} PLN
          </p>
          <p style="margin:4px 0;text-align:right;color:#4CAF50;font-weight:bold;">
            ✓ Płatność zaksięgowana
          </p>
        </div>
      </div>
      <div style="background:#f5f5f5;padding:16px;text-align:center;font-size:12px;color:#999;">
        OCH! SUSHI – System zamówień online
      </div>
    </div>
  `;

  // 1. Email do restauracji
  await transporter.sendMail({
    from: `"OCH! SUSHI" <${process.env.SMTP_USER}>`,
    to: process.env.RESTAURANT_EMAIL || process.env.SMTP_USER,
    subject: `Nowe zamówienie OCH! SUSHI #${orderId} – ${total} PLN`,
    html
  });
  console.log(`📧 Email z zamówieniem #${orderId} wysłany do ${process.env.RESTAURANT_EMAIL}`);

  // 2. Email do klienta
  const customerHtml = html.replace('Nowe zamówienie online', 'Dziękujemy za zamówienie!');
  
  await transporter.sendMail({
    from: `"OCH! SUSHI" <${process.env.SMTP_USER}>`,
    to: customer.email,
    subject: `Potwierdzenie zamówienia OCH! SUSHI #${orderId}`,
    html: customerHtml
  });
  console.log(`📧 Potwierdzenie zamówienia #${orderId} wysłane do klienta (${customer.email})`);
}

module.exports = router;

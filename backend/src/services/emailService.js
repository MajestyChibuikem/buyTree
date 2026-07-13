const nodemailer = require('nodemailer');

// Create reusable transporter
const createTransporter = () => {
  // For development, use Ethereal (fake SMTP)
  // For production, configure with real SMTP service (Gmail, SendGrid, etc.)
  if (process.env.NODE_ENV === 'production') {
    return nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    // Development: Log emails to console instead of sending
    return nodemailer.createTransporter({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: process.env.ETHEREAL_USER || 'test@ethereal.email',
        pass: process.env.ETHEREAL_PASS || 'test',
      },
      // In development, just log
      streamTransport: true,
      newline: 'unix',
      buffer: true,
    });
  }
};

const formatPrice = (amount) => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
  }).format(amount);
};

// Send order confirmation email to buyer
const sendOrderConfirmation = async (orderData) => {
  try {
    const {
      buyerEmail,
      buyerName,
      orderNumber,
      items,
      subtotal,
      deliveryFee,
      totalAmount,
      deliveryAddress,
      trackingToken,
    } = orderData;

    const itemsHtml = items
      .map(
        (item) => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">
            ${item.productName}
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: center;">
            ${item.quantity}
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: right;">
            ${formatPrice(item.price)}
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: right;">
            ${formatPrice(item.price * item.quantity)}
          </td>
        </tr>
      `
      )
      .join('');

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Order Confirmation</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #16a34a; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0;">BuyTree</h1>
            <p style="margin: 10px 0 0 0;">Order Confirmation</p>
          </div>

          <div style="background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-top: none;">
            <p>Hello ${buyerName},</p>
            <p>Thank you for your order! We're processing it and will notify you when it ships.</p>

            <div style="background-color: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h2 style="margin-top: 0; color: #16a34a;">Order #${orderNumber}</h2>

              <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <thead>
                  <tr style="background-color: #f3f4f6;">
                    <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e5e7eb;">Product</th>
                    <th style="padding: 10px; text-align: center; border-bottom: 2px solid #e5e7eb;">Qty</th>
                    <th style="padding: 10px; text-align: right; border-bottom: 2px solid #e5e7eb;">Price</th>
                    <th style="padding: 10px; text-align: right; border-bottom: 2px solid #e5e7eb;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="3" style="padding: 10px; text-align: right; font-weight: bold;">Subtotal:</td>
                    <td style="padding: 10px; text-align: right;">${formatPrice(subtotal)}</td>
                  </tr>
                  <tr>
                    <td colspan="3" style="padding: 10px; text-align: right; font-weight: bold;">Delivery Fee:</td>
                    <td style="padding: 10px; text-align: right;">${formatPrice(deliveryFee)}</td>
                  </tr>
                  <tr style="background-color: #f3f4f6;">
                    <td colspan="3" style="padding: 10px; text-align: right; font-weight: bold; font-size: 18px;">Total:</td>
                    <td style="padding: 10px; text-align: right; font-weight: bold; font-size: 18px; color: #16a34a;">${formatPrice(totalAmount)}</td>
                  </tr>
                </tfoot>
              </table>

              <div style="margin-top: 20px;">
                <h3 style="color: #16a34a;">Delivery Address</h3>
                <p style="margin: 5px 0;">${deliveryAddress.address}</p>
                <p style="margin: 5px 0;">${deliveryAddress.city}, ${deliveryAddress.state}</p>
                <p style="margin: 5px 0;">Phone: ${deliveryAddress.phone}</p>
              </div>
            </div>

            <p>You can track your order status in your <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/${trackingToken ? `orders/track/${trackingToken}` : 'orders'}" style="color: #16a34a;">orders page</a>.</p>

            <p>If you have any questions, please don't hesitate to contact us.</p>

            <p>Best regards,<br>The BuyTree Team</p>
          </div>

          <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 12px;">
            <p>This is an automated email, please do not reply.</p>
            <p>&copy; 2025 BuyTree. All rights reserved.</p>
          </div>
        </body>
      </html>
    `;

    const transporter = createTransporter();

    const mailOptions = {
      from: `"BuyTree" <${process.env.SMTP_FROM || 'noreply@buytree.com'}>`,
      to: buyerEmail,
      subject: `Order Confirmation #${orderNumber} - BuyTree`,
      html,
    };

    // In development, log to console
    if (process.env.NODE_ENV !== 'production') {
      console.log('📧 Email would be sent to:', buyerEmail);
      console.log('Subject:', mailOptions.subject);
      console.log('---');
      return { success: true, dev: true };
    }

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Order confirmation email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending order confirmation email:', error);
    return { success: false, error: error.message };
  }
};

// Send order status update email to buyer
const sendOrderStatusUpdate = async (orderData) => {
  try {
    const db = require('../config/database');

    let buyerEmail = orderData.buyerEmail || orderData.buyer_email;
    let buyerName = orderData.buyerName || orderData.delivery_name || orderData.buyer_name;
    const orderNumber = orderData.orderNumber || orderData.order_number;
    const status = orderData.status;
    let shopName = orderData.shopName || orderData.shop_name;
    const trackingToken = orderData.tracking_token || orderData.trackingToken;

    const orderId = orderData.id;

    // Fetch missing details from DB if needed
    if ((!buyerEmail || !buyerName || !shopName) && orderId) {
      const orderDetails = await db.query(
        `SELECT o.buyer_email, o.delivery_name, o.tracking_token, s.shop_name, u.email as user_email, u.first_name, u.last_name
         FROM orders o
         JOIN sellers s ON o.seller_id = s.id
         LEFT JOIN users u ON o.buyer_id = u.id
         WHERE o.id = $1`,
        [orderId]
      );
      if (orderDetails.rows.length > 0) {
        const row = orderDetails.rows[0];
        buyerEmail = row.buyer_email || row.user_email;
        buyerName = row.delivery_name || (row.first_name ? `${row.first_name} ${row.last_name}` : 'Customer');
        shopName = row.shop_name;
      }
    }

    if (!buyerEmail) {
      console.error(`⚠️ Cannot send status update: no email found for order #${orderNumber}`);
      return { success: false, error: 'No buyer email found' };
    }

    const statusMessages = {
      processing: {
        title: 'Your order is being processed',
        message: `Your order from ${shopName} is now being prepared.`,
      },
      shipped: {
        title: 'Your order has been shipped',
        message: `Great news! Your order from ${shopName} is on its way to you.`,
      },
      delivered: {
        title: 'Your order has been delivered',
        message: `Your order from ${shopName} has been delivered. We hope you enjoy your purchase!`,
      },
    };

    const statusInfo = statusMessages[status];
    if (!statusInfo) return { success: false, error: 'Invalid status' };

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Order Status Update</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #16a34a; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0;">BuyTree</h1>
            <p style="margin: 10px 0 0 0;">Order Update</p>
          </div>

          <div style="background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-top: none;">
            <p>Hello ${buyerName},</p>

            <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
              <h2 style="color: #16a34a; margin-top: 0;">${statusInfo.title}</h2>
              <p style="font-size: 18px; margin: 20px 0;">Order #${orderNumber}</p>
              <p>${statusInfo.message}</p>
            </div>

            <p>Track your order anytime in your <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/${trackingToken ? `orders/track/${trackingToken}` : 'orders'}" style="color: #16a34a;">orders page</a>.</p>

            <p>Best regards,<br>The BuyTree Team</p>
          </div>

          <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 12px;">
            <p>This is an automated email, please do not reply.</p>
            <p>&copy; 2025 BuyTree. All rights reserved.</p>
          </div>
        </body>
      </html>
    `;

    const transporter = createTransporter();

    const mailOptions = {
      from: `"BuyTree" <${process.env.SMTP_FROM || 'noreply@buytree.com'}>`,
      to: buyerEmail,
      subject: `${statusInfo.title} - Order #${orderNumber}`,
      html,
    };

    // In development, log to console
    if (process.env.NODE_ENV !== 'production') {
      console.log('📧 Email would be sent to:', buyerEmail);
      console.log('Subject:', mailOptions.subject);
      console.log('---');
      return { success: true, dev: true };
    }

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Order status update email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending order status update email:', error);
    return { success: false, error: error.message };
  }
};

// Send new order notification to seller
const sendSellerNewOrderNotification = async (orderData) => {
  try {
    const { sellerEmail, sellerName, orderNumber, buyerName, items, totalAmount } = orderData;

    const itemsList = items
      .map((item) => `<li>${item.quantity}x ${item.productName} - ${formatPrice(item.price * item.quantity)}</li>`)
      .join('');

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Order Received</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #16a34a; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0;">BuyTree</h1>
            <p style="margin: 10px 0 0 0;">New Order Received!</p>
          </div>

          <div style="background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-top: none;">
            <p>Hello ${sellerName},</p>
            <p>Great news! You've received a new order.</p>

            <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h2 style="color: #16a34a; margin-top: 0;">Order #${orderNumber}</h2>
              <p><strong>Customer:</strong> ${buyerName}</p>

              <h3>Order Items:</h3>
              <ul>${itemsList}</ul>

              <p style="font-size: 18px; font-weight: bold; color: #16a34a;">
                Total: ${formatPrice(totalAmount)}
              </p>
            </div>

            <p>Please log in to your <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/seller/orders" style="color: #16a34a;">seller dashboard</a> to process this order.</p>

            <p>Best regards,<br>The BuyTree Team</p>
          </div>

          <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 12px;">
            <p>This is an automated email, please do not reply.</p>
            <p>&copy; 2025 BuyTree. All rights reserved.</p>
          </div>
        </body>
      </html>
    `;

    const transporter = createTransporter();

    const mailOptions = {
      from: `"BuyTree" <${process.env.SMTP_FROM || 'noreply@buytree.com'}>`,
      to: sellerEmail,
      subject: `New Order #${orderNumber} - BuyTree`,
      html,
    };

    // In development, log to console
    if (process.env.NODE_ENV !== 'production') {
      console.log('📧 Email would be sent to:', sellerEmail);
      console.log('Subject:', mailOptions.subject);
      console.log('---');
      return { success: true, dev: true };
    }

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Seller notification email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending seller notification email:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendOrderConfirmation,
  sendOrderStatusUpdate,
  sendSellerNewOrderNotification,
};

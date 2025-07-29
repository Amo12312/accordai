# 🚀 Production Deployment Guide for Accord AI

## 📋 Pre-Production Checklist

### 1. Razorpay Production Setup

#### Step 1: Get Production Keys
1. Login to [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Switch from "Test Mode" to "Live Mode"
3. Go to **Settings > API Keys**
4. Copy your **Live Key ID** (starts with `rzp_live_`)
5. Copy your **Live Key Secret**
6. Generate a **Webhook Secret** for production

#### Step 2: Update Environment Variables
Replace the following in your production `.env` file:

```bash
# Production Keys
RAZORPAY_KEY_ID=rzp_live_YOUR_ACTUAL_KEY_ID
RAZORPAY_KEY_SECRET=YOUR_ACTUAL_SECRET_KEY
RAZORPAY_WEBHOOK_SECRET=YOUR_WEBHOOK_SECRET
NODE_ENV=production
```

### 2. Razorpay Webhook Configuration

#### Backend Webhook Endpoint
Your webhook URL for production: `https://your-domain.com/api/payment/webhook`

#### Webhook Events to Subscribe
In Razorpay Dashboard > Settings > Webhooks, add these events:
- `payment.captured`
- `payment.failed`
- `subscription.charged`
- `subscription.cancelled`

### 3. Production Environment Variables

```bash
# Server Configuration
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://your-domain.com

# Razorpay Production Keys
RAZORPAY_KEY_ID=rzp_live_XXXXXXXXXXXXXXXX
RAZORPAY_KEY_SECRET=your_live_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret

# Database (Use MongoDB Atlas for production)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/accord-ai-prod

# JWT (Generate a strong secret)
JWT_SECRET=your-256-bit-production-secret-key
JWT_EXPIRES_IN=7d

# AI API
GEMINI_API_KEY=your_production_gemini_key

# Email Configuration
EMAIL_USER=noreply@your-domain.com
EMAIL_PASSWORD=your_email_app_password
```

## 🔧 Deployment Steps

### 1. Backend Deployment

```bash
# 1. Set environment to production
export NODE_ENV=production

# 2. Install production dependencies
npm ci --only=production

# 3. Start the server
npm start
```

### 2. Frontend Deployment

```bash
# 1. Build for production
npm run build

# 2. Deploy build folder to your hosting service
# (Vercel, Netlify, AWS S3, etc.)
```

### 3. SSL Certificate
Ensure your domain has SSL certificate for HTTPS (required for Razorpay)

## 🧪 Testing Production Setup

### Test Payment Flow
1. Use small amount (₹1) for testing
2. Test with real card details (use your own card)
3. Verify payment appears in Razorpay Dashboard
4. Check webhook receives events properly

### Razorpay Test Cards (for final testing)
```
Success: 4111 1111 1111 1111
Failure: 4000 0000 0000 0002
CVV: Any 3 digits
Expiry: Any future date
```

## 🛡️ Security Checklist

- [ ] Environment variables properly set
- [ ] No sensitive keys in code repository
- [ ] HTTPS enabled on production domain
- [ ] Webhook secret properly configured
- [ ] CORS configured for production domain
- [ ] JWT secret is strong and unique
- [ ] Database access restricted
- [ ] API rate limiting enabled

## 📊 Monitoring

### Razorpay Dashboard
- Monitor transactions in real-time
- Check for failed payments
- Review settlement reports

### Application Logs
- Monitor payment webhook events
- Track subscription activations
- Watch for API errors

## 🚨 Troubleshooting

### Common Issues
1. **Payment not processing**: Check API keys in environment
2. **Webhook not firing**: Verify webhook URL and secret
3. **CORS errors**: Update FRONTEND_URL in backend
4. **SSL errors**: Ensure HTTPS on production domain

### Support Contacts
- Razorpay Support: support@razorpay.com
- Documentation: https://razorpay.com/docs/

---

## 📞 Quick Setup Command

For quick production setup, update your `.env` file with:

```bash
NODE_ENV=production
RAZORPAY_KEY_ID=your_live_key_here
RAZORPAY_KEY_SECRET=your_live_secret_here
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_here
```

Then restart your backend server!

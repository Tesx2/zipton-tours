/**
 * Premium Booking & Payment System
 * Zipton Tours Luxury Travel Checkout Experience
 * 
 * Debug: Open browser console (F12) to see detailed logs
 */

console.log('📦 Premium Booking System Script Loaded');

class PremiumBookingSystem {
  constructor() {
    this.currentPaymentMethod = 'mpesa';
    this.bookingSummary = {
      tourName: '',
      tourThumb: '',
      tourSlug: '',
      durationDays: null,
      guests: 1,
      baseAmount: 0,
      totalAmount: 0,
      depositAmount: 0,
      remainingBalance: 0,
      isDeposit: false,
      purpose: 'booking'
    };
    this.init();
  }

  init() {
    this.setupPaymentModal();
    this.setupPaymentTabs();
    this.setupReservationToggle();
    this.setupGuestControls();
    this.setupDonationAmountControls();
    this.setupStripeCardForm();
    this.attachEventListeners();
  }

  // Initialize the premium payment modal
  setupPaymentModal() {
    const paymentModal = document.getElementById('premium-payment-modal');
    if (!paymentModal) {
      console.warn('Premium payment modal not found');
      return;
    }

    const backdrop = paymentModal.querySelector('.payment-modal-backdrop');
    const closeBtn = paymentModal.querySelector('.modal-close');

    if (backdrop) {
      backdrop.addEventListener('click', () => this.closePaymentModal());
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closePaymentModal());
    }

    // Close on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && paymentModal.classList.contains('active')) {
        this.closePaymentModal();
      }
    });
  }

  // Setup tab switching for payment methods
  setupPaymentTabs() {
    const tabs = document.querySelectorAll('[data-payment-tab]');
    console.log(`✅ Found ${tabs.length} payment tabs`);
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        console.log(`🔵 Switching to payment method: ${tab.dataset.paymentTab}`);
        this.switchPaymentMethod(tab.dataset.paymentTab);
      });
    });
  }

  // Setup deposit vs full payment toggle
  setupReservationToggle() {
    const toggleInputs = document.querySelectorAll('[name="payment-option"]');
    toggleInputs.forEach(input => {
      input.addEventListener('change', (e) => {
        this.bookingSummary.isDeposit = e.target.value === 'deposit';
        this.updateBookingSummary();
      });
    });
  }

  // Guest count controls in modal header
  setupGuestControls() {
    const input = document.getElementById('summary-guests');
    const decBtn = document.getElementById('guests-decrease');
    const incBtn = document.getElementById('guests-increase');
    if (!input || !decBtn || !incBtn) return;

    const min = parseInt(input.min || '1', 10);
    const max = parseInt(input.max || '10', 10);

    const clamp = (n) => Math.min(max, Math.max(min, n));

    const setGuests = (n) => {
      const value = clamp(n);
      input.value = String(value);
      this.bookingSummary.guests = value;
      this.recalculateBookingAmounts();
      this.updateBookingSummary();
    };

    decBtn.addEventListener('click', () => {
      const n = parseInt(input.value || '1', 10);
      setGuests(n - 1);
    });

    incBtn.addEventListener('click', () => {
      const n = parseInt(input.value || '1', 10);
      setGuests(n + 1);
    });

    input.addEventListener('input', () => {
      const n = parseInt(input.value || String(min), 10);
      if (!Number.isFinite(n)) return;
      setGuests(n);
    });
  }

  setupDonationAmountControls() {
    const input = document.getElementById('donation-amount');
    if (!input) return;

    const setDonationAmount = () => {
      const amount = this.parseMoneyAmount(input.value);
      if (amount < 1) return;

      this.bookingSummary.baseAmount = amount;
      this.bookingSummary.totalAmount = amount;
      this.bookingSummary.depositAmount = 0;
      this.bookingSummary.remainingBalance = 0;
      this.updateBookingSummary();
    };

    input.addEventListener('input', setDonationAmount);
    input.addEventListener('change', setDonationAmount);
  }

  // Premium card input masking + card type detection (client-side only)
  setupStripeCardForm() {
    const cardNumberInput = document.getElementById('card-number');
    const expiryInput = document.getElementById('card-expiry');
    const cvvInput = document.getElementById('card-cvv');
    const cardTypeBadge = document.getElementById('card-type-badge');

    if (!cardNumberInput || !expiryInput || !cvvInput || !cardTypeBadge) return;

    const updateCardType = (digits) => {
      const type = this.detectCardType(digits);
      cardTypeBadge.textContent = `Card: ${type}`;
    };

    cardNumberInput.addEventListener('input', () => {
      const digits = String(cardNumberInput.value || '').replace(/\D/g, '').slice(0, 19);
      cardNumberInput.value = this.formatCardNumber(digits);
      updateCardType(digits);
    });

    expiryInput.addEventListener('input', () => {
      const digits = String(expiryInput.value || '').replace(/\D/g, '').slice(0, 4);
      expiryInput.value = this.formatExpiry(digits);
    });

    cvvInput.addEventListener('input', () => {
      const digits = String(cvvInput.value || '').replace(/\D/g, '').slice(0, 4);
      cvvInput.value = digits;
    });

    // Initialize badge from any prefilled values
    const initialDigits = String(cardNumberInput.value || '').replace(/\D/g, '');
    if (initialDigits) {
      cardNumberInput.value = this.formatCardNumber(initialDigits.slice(0, 19));
      updateCardType(initialDigits);
    }
  }

  // Main event listeners for booking buttons
  attachEventListeners() {
    // Open payment modal
    const payReserveBtn = document.getElementById('pay-reserve-btn');
    if (payReserveBtn) {
      console.log('✅ Pay/Reserve button found, attaching click listener');
      payReserveBtn.addEventListener('click', () => {
        console.log('🎯 Pay/Reserve button clicked!');
        this.openPaymentModal();
      });
    } else {
      console.warn('⚠️ Pay/Reserve button not found');
    }

    // Payment form submissions
    const mpesaForm = document.getElementById('mpesa-payment-form');
    if (mpesaForm) {
      console.log('✅ M-Pesa form found');
      mpesaForm.addEventListener('submit', (e) => this.handleMpesaPayment(e));
    }

    const cardForm = document.getElementById('stripe-payment-form');
    if (cardForm) {
      console.log('✅ Card form found');
      cardForm.addEventListener('submit', (e) => this.handleCardPayment(e));
    }

    const paypalBtn = document.getElementById('paypal-payment-btn');
    if (paypalBtn) {
      console.log('✅ PayPal button found');
      paypalBtn.addEventListener('click', () => this.handlePayPalPayment());
    }

    const pesapalBtn = document.getElementById('pesapal-payment-btn');
    if (pesapalBtn) {
      console.log('✅ PesaPal button found');
      pesapalBtn.addEventListener('click', () => this.handlePesapalPayment());
    }
  }

  // Open payment modal with animation
  openPaymentModal() {
    console.log('🔵 Opening payment modal...');
    const modal = document.getElementById('premium-payment-modal');
    if (!modal) {
      console.error('❌ Modal element not found');
      return;
    }

    modal.setAttribute('aria-hidden', 'false');
    const launcher = document.getElementById('pay-reserve-btn');
    this.bookingSummary.purpose = launcher && launcher.dataset.paymentPurpose === 'donation'
      ? 'donation'
      : 'booking';

    // Get tour data from the page
    console.log('🔵 Extracting tour data...');
    this.extractTourData();

    // Sync reservation type from modal toggle state
    const selectedToggle = document.querySelector('input[name="payment-option"]:checked');
    if (selectedToggle) {
      this.bookingSummary.isDeposit = selectedToggle.value === 'deposit';
      this.updateBookingSummary();
    }

    // Reset in-modal success state + ensure payment UI is visible
    const successView = document.getElementById('payment-success-view');
    if (successView) successView.style.display = 'none';
    const tabsEl = document.querySelector('.payment-tabs');
    if (tabsEl) tabsEl.style.display = '';
    const viewsEl = document.querySelector('.payment-views');
    if (viewsEl) viewsEl.style.display = '';
    const paymentViewEls = modal.querySelectorAll('.payment-view');
    paymentViewEls.forEach((el) => {
      el.style.display = '';
    });
    this.switchPaymentMethod(this.currentPaymentMethod || 'mpesa');

    // Show modal with animation
    console.log('🔵 Adding active class to modal');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Trigger animation
    setTimeout(() => {
      console.log('🔵 Adding animated class to modal');
      modal.classList.add('animated');
      console.log('✅ Modal opened successfully');
    }, 10);
  }

  // Close payment modal
  closePaymentModal() {
    const modal = document.getElementById('premium-payment-modal');
    if (!modal) return;

    modal.classList.remove('animated');
    setTimeout(() => {
      modal.classList.remove('active');
      modal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }, 300);
  }

  // Extract tour data from page
  extractTourData() {
    if (this.bookingSummary.purpose === 'donation') {
      const donationInput = document.getElementById('donation-amount');
      const amount = this.parseMoneyAmount(donationInput ? donationInput.value : '') || 1000;

      this.bookingSummary.tourName = 'Support Zipton Tours Mission';
      this.bookingSummary.tourSlug = 'support-our-mission';
      this.bookingSummary.tourThumb = 'images/logo-main.png';
      this.bookingSummary.durationDays = null;
      this.bookingSummary.guests = 1;
      this.bookingSummary.isDeposit = false;
      this.bookingSummary.baseAmount = amount;
      this.bookingSummary.totalAmount = amount;
      this.bookingSummary.depositAmount = 0;
      this.bookingSummary.remainingBalance = 0;
      if (donationInput) donationInput.value = String(amount);
      this.updateBookingSummary();
      return;
    }

    const tourTitle = document.getElementById('tour-title');
    const tourPrice = document.getElementById('tour-price');
    const tourCategory = document.getElementById('tour-category');
    const tourThumb = document.querySelector('#tour-detail-image img');
    const params = new URLSearchParams(window.location.search);
    this.bookingSummary.tourSlug = params.get('tour') || '';

    if (tourTitle) this.bookingSummary.tourName = tourTitle.textContent;
    if (tourThumb) this.bookingSummary.tourThumb = tourThumb.src;

    if (tourCategory) {
      const durationText = tourCategory.textContent || '';
      this.bookingSummary.durationDays = this.parseDaysFromDuration(durationText);
    }

    const guestsInput = document.getElementById('summary-guests');
    if (guestsInput) {
      const n = parseInt(guestsInput.value || '1', 10);
      if (Number.isFinite(n) && n > 0) this.bookingSummary.guests = n;
    }

    if (tourPrice) {
      const priceText = tourPrice.textContent.replace(/[^0-9,]/g, '');
      this.bookingSummary.baseAmount = parseInt(priceText.replace(/,/g, '')) || 85000;
    }

    this.recalculateBookingAmounts();
    this.updateBookingSummary();
  }

  recalculateBookingAmounts() {
    if (this.bookingSummary.purpose === 'donation') {
      const amount = this.bookingSummary.baseAmount || this.bookingSummary.totalAmount || 1000;
      this.bookingSummary.totalAmount = amount;
      this.bookingSummary.depositAmount = 0;
      this.bookingSummary.remainingBalance = 0;
      return;
    }

    const baseAmount = this.bookingSummary.baseAmount || this.bookingSummary.totalAmount || 85000;
    const guests = Math.max(1, parseInt(this.bookingSummary.guests || '1', 10) || 1);

    this.bookingSummary.baseAmount = baseAmount;
    this.bookingSummary.guests = guests;
    this.bookingSummary.totalAmount = baseAmount * guests;
    this.bookingSummary.depositAmount = Math.ceil(this.bookingSummary.totalAmount * 0.2);
    this.bookingSummary.remainingBalance = Math.max(
      0,
      this.bookingSummary.totalAmount - this.bookingSummary.depositAmount
    );
  }

  // Update booking summary display
  updateBookingSummary() {
    const fmt = (n) => `KSh ${Number(n || 0).toLocaleString()}`;

    const totalAmountEl = document.getElementById('summary-total-amount');
    const todayLabelEl = document.getElementById('summary-today-label');
    const todayAmountEl = document.getElementById('summary-today-amount');

    const tourNameEl = document.getElementById('summary-tour-name');
    const tourThumbEl = document.getElementById('summary-tour-thumb');

    const guestsCountEl = document.getElementById('summary-guests-count');
    const durationDaysEl = document.getElementById('summary-duration-days');

    const depositEl = document.getElementById('summary-deposit-amount');
    const remainingEl = document.getElementById('summary-remaining-balance');
    const depositInfo = document.getElementById('deposit-info');

    const mpesaAmountEl = document.getElementById('mpesa-amount');

    if (tourNameEl) tourNameEl.textContent = this.bookingSummary.tourName || 'Your Tour';
    if (tourThumbEl && this.bookingSummary.tourThumb) tourThumbEl.src = this.bookingSummary.tourThumb;

    if (guestsCountEl) {
      const g = this.bookingSummary.guests || 1;
      guestsCountEl.textContent = this.bookingSummary.purpose === 'donation'
        ? 'Support contribution'
        : `${g} ${g === 1 ? 'Guest' : 'Guests'}`;
    }

    if (durationDaysEl) {
      const d = this.bookingSummary.durationDays;
      durationDaysEl.textContent = this.bookingSummary.purpose === 'donation'
        ? 'Open amount'
        : d ? `${d} Days` : '- Days';
    }

    if (totalAmountEl) totalAmountEl.textContent = fmt(this.bookingSummary.totalAmount);

    if (todayLabelEl) {
      todayLabelEl.textContent = this.bookingSummary.purpose === 'donation'
        ? 'Donation Today:'
        : this.bookingSummary.isDeposit ? 'Deposit Today:' : 'Pay Today:';
    }

    const todayAmount = this.getPaymentAmount();

    if (todayAmountEl) todayAmountEl.textContent = fmt(todayAmount);
    if (mpesaAmountEl) mpesaAmountEl.value = fmt(todayAmount);

    if (depositEl) depositEl.textContent = fmt(this.bookingSummary.depositAmount);
    if (remainingEl) remainingEl.textContent = fmt(this.bookingSummary.remainingBalance);

    if (depositInfo) {
      depositInfo.classList.toggle('show', this.bookingSummary.isDeposit);
    }
  }

  getPaymentAmount() {
    if (this.bookingSummary.purpose === 'donation') {
      return this.bookingSummary.totalAmount;
    }

    return this.bookingSummary.isDeposit
      ? this.bookingSummary.depositAmount
      : this.bookingSummary.totalAmount;
  }

  getFunctionUrl(functionName) {
    const netlifyBase = 'https://ziptontour.netlify.app/.netlify/functions';
    const isNetlifyHost = window.location.hostname.includes('netlify.app');
    const base = isNetlifyHost ? '/.netlify/functions' : netlifyBase;
    return `${base}/${functionName}`;
  }

  // Switch between payment methods
  switchPaymentMethod(method) {
    this.currentPaymentMethod = method;

    // Update active tab
    const tabs = document.querySelectorAll('[data-payment-tab]');
    tabs.forEach(tab => {
      tab.classList.toggle('active', tab.dataset.paymentTab === method);
    });

    // Update active view
    const views = document.querySelectorAll('.payment-view');
    views.forEach(view => {
      view.classList.toggle('active', view.dataset.paymentMethod === method);
    });

    const successView = document.getElementById('payment-success-view');
    if (successView) successView.style.display = 'none';
  }

  showPaymentSuccessState({ bookingRef, tourName, durationDays, guests, amountToday, reservationType, paymentMethod }) {
    const modal = document.getElementById('premium-payment-modal');
    const successView = document.getElementById('payment-success-view');
    if (!successView) return;

    const tabsEl = modal ? modal.querySelector('.payment-tabs') : null;
    const viewsEl = modal ? modal.querySelector('.payment-views') : null;
    if (tabsEl) tabsEl.style.display = 'none';
    // Hide all payment panels; show only the success panel.
    const paymentViewEls = modal ? modal.querySelectorAll('.payment-view') : [];
    paymentViewEls.forEach((el) => {
      el.style.display = 'none';
    });

    // Keep the payment-views layout visible so the in-modal success panel can render.

    successView.style.display = 'block';

    const fmtKSh = (n) => `KSh ${Number(n || 0).toLocaleString()}`;

    const msgEl = document.getElementById('success-message');
    if (msgEl) {
      if (reservationType === 'Reserve with Deposit') {
        msgEl.textContent = 'Reservation secured with deposit';
      } else {
        msgEl.textContent = 'Reservation confirmed';
      }
    }

    const refEl = document.getElementById('success-booking-ref');
    if (refEl) refEl.textContent = bookingRef || '—';

    const tourEl = document.getElementById('success-tour-name');
    if (tourEl) tourEl.textContent = tourName || this.bookingSummary.tourName || '—';

    const guestsEl = document.getElementById('success-guests');
    if (guestsEl) {
      const g = guests || 1;
      guestsEl.textContent = `${g} ${g === 1 ? 'Guest' : 'Guests'}`;
    }

    const durationEl = document.getElementById('success-duration');
    if (durationEl) {
      const d = durationDays || this.bookingSummary.durationDays;
      durationEl.textContent = d ? `${d} Days` : '—';
    }

    const amountEl = document.getElementById('success-amount-today');
    if (amountEl) amountEl.textContent = amountToday != null ? fmtKSh(amountToday) : '—';

    const btnView = document.getElementById('success-view-booking');
    if (btnView) {
      btnView.href = `contact.html?bookingRef=${encodeURIComponent(bookingRef || '')}&tour=${encodeURIComponent(
        tourName || this.bookingSummary.tourName || ''
      )}`;
    }

    // Ensure modal close/escape UX stays consistent; we only swap views.
    document.body.style.overflow = 'hidden';
  }

  // Handle M-Pesa payment
  async handleMpesaPayment(e) {
    e.preventDefault();
    const form = e.target;
    const phoneInput = form.querySelector('input[name="phone"]');
    const statusEl = form.querySelector('.form-status');

    if (!this.validatePhone(phoneInput.value)) {
      this.showError(statusEl, 'Invalid phone number');
      return;
    }

    const proceedBtn = document.getElementById('mpesa-proceed-btn');
    const proceedSpinner = document.getElementById('mpesa-proceed-spinner');

    const amount = this.getPaymentAmount();

    if (!amount || amount < 1) {
      this.showError(statusEl, 'Invalid payment amount');
      return;
    }

    if (proceedBtn) proceedBtn.disabled = true;
    if (proceedSpinner) proceedSpinner.style.display = 'inline-block';

    this.showLoading(statusEl, 'Sending STK Push...');

    try {

      const response = await fetch(this.getFunctionUrl('create-mpesa-stk'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phoneInput.value,
          amount: amount,
          tour: this.bookingSummary.tourSlug,
          tourName: this.bookingSummary.tourName,
          isDeposit: this.bookingSummary.isDeposit
        })
      });

      const data = await response.json();

      if (response.ok) {
        const bookingRef = this.generateBookingRef();
        sessionStorage.setItem('ziptonBookingRef', bookingRef);
        this.showPaymentSuccessState({
          bookingRef,
          tourName: this.bookingSummary.tourName,
          durationDays: this.bookingSummary.durationDays,
          guests: this.bookingSummary.guests,
          amountToday: amount,
          reservationType: this.bookingSummary.purpose === 'donation' ? 'Donation' : this.bookingSummary.isDeposit ? 'Reserve with Deposit' : 'Full Payment',
          paymentMethod: 'M-Pesa'
        });
      } else {
        this.showError(statusEl, data.error || 'Payment initiation failed');
        if (proceedBtn) proceedBtn.disabled = false;
        if (proceedSpinner) {
          proceedSpinner.style.display = 'none';
        }
      }
    } catch (error) {
      console.error('M-Pesa error:', error);
      this.showError(statusEl, 'Network error. Please try again.');
      if (proceedBtn) proceedBtn.disabled = false;
      if (proceedSpinner) proceedSpinner.style.display = 'none';
    }
  }

  // Handle Card Payment (Stripe)
  async handleCardPayment(e) {
    e.preventDefault();
    const form = e.target;
    const statusEl = form.querySelector('.form-status');

    const cardholder = form.querySelector('input[name="cardholder"]');
    if (!cardholder || !cardholder.value) {
      this.showError(statusEl, 'Please enter cardholder name');
      return;
    }

    const expiryInput = form.querySelector('input[name="card-expiry"]');
    const cvvInput = form.querySelector('input[name="card-cvv"]');

    const expiry = expiryInput ? expiryInput.value : '';
    const cvv = cvvInput ? cvvInput.value : '';

    if (!expiry || !/^\d{2}\/\d{2}$/.test(expiry)) {
      this.showError(statusEl, 'Enter a valid expiry date (MM/YY)');
      return;
    }
    if (!cvv || !/^\d{3,4}$/.test(cvv)) {
      this.showError(statusEl, 'Enter a valid CVV');
      return;
    }

    const payBtn = document.getElementById('stripe-pay-btn');
    const paySpinner = document.getElementById('stripe-pay-spinner');
    const payText = document.getElementById('stripe-pay-btn-text');

    if (payBtn) payBtn.disabled = true;
    if (paySpinner) paySpinner.style.display = 'inline-block';
    if (payText) payText.textContent = 'Redirecting...';

    this.showLoading(statusEl, 'Processing payment...');

    try {
      const cardNumber = form.querySelector('input[name="card-number"]').value.replace(/\s/g, '');

      if (!this.validateCard(cardNumber)) {
        this.showError(statusEl, 'Invalid card number');
        return;
      }

      const amount = this.getPaymentAmount();

      const bookingRef = this.generateBookingRef();
      sessionStorage.setItem('ziptonBookingRef', bookingRef);
      sessionStorage.setItem(
        'ziptonBookingData',
        JSON.stringify({
          bookingRef,
          tourName: this.bookingSummary.tourName,
          tourSlug: this.bookingSummary.tourSlug,
          durationDays: this.bookingSummary.durationDays,
          guests: this.bookingSummary.guests,
          totalAmount: this.bookingSummary.totalAmount,
          depositAmount: this.bookingSummary.depositAmount,
          remainingBalance: this.bookingSummary.remainingBalance,
          reservationType: this.bookingSummary.purpose === 'donation' ? 'Donation' : this.bookingSummary.isDeposit ? 'Reserve with Deposit' : 'Full Payment',
          amountToday: amount,
          paymentMethod: 'Stripe Card'
        })
      );

      const response = await fetch(this.getFunctionUrl('create-stripe-checkout'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amount,
          tour: this.bookingSummary.tourSlug,
          tourName: this.bookingSummary.tourName,
          cardholder: cardholder.value,
          bookingRef: bookingRef,
          isDeposit: this.bookingSummary.isDeposit
        })
      });

      const data = await response.json();

      if (response.ok && data.url) {
        window.location.href = data.url;
      } else {
        this.showError(statusEl, data.error || 'Payment failed');
        if (payBtn) payBtn.disabled = false;
        if (paySpinner) paySpinner.style.display = 'none';
        if (payText) payText.textContent = 'Pay Now';
      }
    } catch (error) {
      console.error('Stripe error:', error);
      this.showError(statusEl, 'Payment processing failed');
      if (payBtn) payBtn.disabled = false;
      if (paySpinner) paySpinner.style.display = 'none';
      if (payText) payText.textContent = 'Pay Now';
    }
  }

  // Handle PayPal payment
  async handlePayPalPayment() {
    const paypalBtn = document.getElementById('paypal-payment-btn');
    const originalText = paypalBtn ? paypalBtn.textContent : '';
    try {
      const amount = this.getPaymentAmount();

      const bookingRef = this.generateBookingRef();
      sessionStorage.setItem('ziptonBookingRef', bookingRef);
      sessionStorage.setItem(
        'ziptonBookingData',
        JSON.stringify({
          bookingRef,
          tourName: this.bookingSummary.tourName,
          tourSlug: this.bookingSummary.tourSlug,
          durationDays: this.bookingSummary.durationDays,
          guests: this.bookingSummary.guests,
          totalAmount: this.bookingSummary.totalAmount,
          depositAmount: this.bookingSummary.depositAmount,
          reservationType: this.bookingSummary.purpose === 'donation' ? 'Donation' : this.bookingSummary.isDeposit ? 'Reserve with Deposit' : 'Full Payment',
          amountToday: amount,
          paymentMethod: 'PayPal'
        })
      );

      if (paypalBtn) {
        paypalBtn.disabled = true;
        paypalBtn.textContent = 'Redirecting...';
      }

      const response = await fetch(this.getFunctionUrl('create-paypal-order'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amount,
          tour: this.bookingSummary.tourSlug,
          tourName: this.bookingSummary.tourName,
          bookingRef: bookingRef,
          isDeposit: this.bookingSummary.isDeposit
        })
      });

      const data = await response.json();

      if (response.ok && (data.approvalUrl || data.url)) {
        window.location.href = data.approvalUrl || data.url;
      }
      else {
        const errorMessage = data.message || "PayPal Checkout could not be opened. No approval URL received.";
        console.error("PayPal API response error:", data);
        alert(`PayPal payment initiation failed: ${errorMessage}`);
      }
    } catch (error) {
      console.error('PayPal error:', error);
      if (paypalBtn) {
        alert(`PayPal payment initiation failed: ${error.message || 'Network error.'}`);
      }
    }
  }

  // Handle PesaPal payment
  async handlePesapalPayment() {
    try {
      const amount = this.getPaymentAmount();

      const pesapalBtn = document.getElementById('pesapal-payment-btn');
      const pesapalOriginalText = pesapalBtn ? pesapalBtn.textContent : '';

      const bookingRef = this.generateBookingRef();
      sessionStorage.setItem('ziptonBookingRef', bookingRef);
      sessionStorage.setItem(
        'ziptonBookingData',
        JSON.stringify({
          bookingRef,
          tourName: this.bookingSummary.tourName,
          tourSlug: this.bookingSummary.tourSlug,
          durationDays: this.bookingSummary.durationDays,
          guests: this.bookingSummary.guests,
          totalAmount: this.bookingSummary.totalAmount,
          depositAmount: this.bookingSummary.depositAmount,
          reservationType: this.bookingSummary.purpose === 'donation' ? 'Donation' : this.bookingSummary.isDeposit ? 'Reserve with Deposit' : 'Full Payment',
          amountToday: amount,
          paymentMethod: 'PesaPal'
        })
      );

      if (pesapalBtn) {
        pesapalBtn.disabled = true;
        pesapalBtn.textContent = 'Redirecting...';
      }

      const response = await fetch(this.getFunctionUrl('create-pesapal-order'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amount,
          tour: this.bookingSummary.tourSlug,
          tourName: this.bookingSummary.tourName,
          bookingRef: bookingRef,
          isDeposit: this.bookingSummary.isDeposit
        })
      });

      const data = await response.json();

      if (response.ok && (data.redirectUrl || data.url)) {
        window.location.href = data.redirectUrl || data.url;
      }
      else {
        const errorMessage = data.message || "PesaPal Checkout could not be opened. No redirect URL received.";
        console.error("PesaPal API response error:", data);
        alert(`PesaPal payment initiation failed: ${errorMessage}`);
      }
    } catch (error) {
      console.error('PesaPal error:', error);
      if (pesapalBtn) {
        alert(`PesaPal payment initiation failed: ${error.message || 'Network error.'}`);
      }
    }
  }

  // Validation helpers
  validatePhone(phone) {
    const phoneRegex = /^(\+254|0)[17][0-9]{8}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  }

  validateCard(cardNumber) {
    return /^\d{13,19}$/.test(cardNumber);
  }

  parseDaysFromDuration(durationText) {
    // Examples: "6 days · Adventure", "Custom · Private"
    const match = String(durationText || '').match(/(\d+)\s*days?/i);
    return match ? parseInt(match[1], 10) : null;
  }

  parseMoneyAmount(value) {
    const amount = Number(String(value || '').replace(/[^0-9.]/g, ''));
    return Number.isFinite(amount) ? Math.round(amount) : 0;
  }

  detectCardType(digits) {
    if (!digits) return 'Card';
    if (/^4/.test(digits)) return 'Visa';
    if (/^(5[1-5]|2[2-7])/.test(digits)) return 'Mastercard';
    if (/^(34|37)/.test(digits)) return 'Amex';
    return 'Card';
  }

  formatCardNumber(digits) {
    // Simple grouping for readability
    const clean = String(digits || '').replace(/\D/g, '').slice(0, 19);
    const groups = clean.match(/.{1,4}/g) || [];
    return groups.join(' ');
  }

  formatExpiry(digits) {
    const clean = String(digits || '').replace(/\D/g, '').slice(0, 4);
    if (clean.length <= 2) return clean;
    return `${clean.slice(0, 2)}/${clean.slice(2)}`;
  }

  generateBookingRef() {
    const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
    const time = Date.now().toString().slice(-5);
    return `ZT-${time}-${rand}`;
  }

  // UI Helper methods
  showLoading(el, message) {
    if (!el) return;
    el.className = 'form-status loading';
    el.innerHTML = `<span class="spinner"></span> ${message}`;
  }

  showSuccess(el, message) {
    if (!el) return;
    el.className = 'form-status success';
    el.textContent = `✓ ${message}`;
  }

  showError(el, message) {
    if (!el) return;
    el.className = 'form-status error';
    el.textContent = `✗ ${message}`;
  }
}

// Initialize booking system when DOM is ready
function initializeBookingSystem() {
  console.log('🎯 Initializing Premium Booking System...');
  
  const payReserveBtn = document.getElementById('pay-reserve-btn');
  const modal = document.getElementById('premium-payment-modal');
  
  // Always attach a fallback click handler so the CTA never becomes a dead button.
  // This protects the flow if initialization fails due to timing or other scripts.
  document.addEventListener(
    'click',
    (e) => {
      const btn = e.target && e.target.closest ? e.target.closest('#pay-reserve-btn') : null;
      if (!btn) return;

      if (window.bookingSystem && typeof window.bookingSystem.openPaymentModal === 'function') {
        window.bookingSystem.openPaymentModal();
        return;
      }

      // Minimal fallback: open modal without the full system.
      const m = document.getElementById('premium-payment-modal');
      if (!m) return;
      m.setAttribute('aria-hidden', 'false');
      m.classList.add('active');
      document.body.style.overflow = 'hidden';
      setTimeout(() => m.classList.add('animated'), 10);
    },
    true
  );

  if (!payReserveBtn) {
    console.error('❌ Pay/Reserve button not found');
    return;
  }

  if (!modal) {
    console.error('❌ Payment modal not found');
    return;
  }

  console.log('✅ Elements found, initializing system');
  window.bookingSystem = new PremiumBookingSystem();
  console.log('✅ Booking system initialized successfully');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeBookingSystem);
} else {
  initializeBookingSystem();
}

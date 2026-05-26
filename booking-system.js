/**
 * Premium Booking & Payment System
 * Zipton Tours Luxury Travel Checkout Experience
 */

class PremiumBookingSystem {
  constructor() {
    this.currentPaymentMethod = 'mpesa';
    this.bookingSummary = {
      tourName: '',
      duration: '',
      guests: 1,
      totalAmount: 0,
      depositAmount: 0,
      isDeposit: false
    };
    this.init();
  }

  init() {
    this.setupPaymentModal();
    this.setupPaymentTabs();
    this.setupReservationToggle();
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
        
        // Show/hide deposit info
        const depositInfo = document.getElementById('deposit-info');
        if (depositInfo) {
          depositInfo.classList.toggle('show', this.bookingSummary.isDeposit);
        }
      });
    });
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

    // Get tour data from the page
    console.log('🔵 Extracting tour data...');
    this.extractTourData();

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
      document.body.style.overflow = '';
    }, 300);
  }

  // Extract tour data from page
  extractTourData() {
    const tourTitle = document.getElementById('tour-title');
    const tourPrice = document.getElementById('tour-price');
    const tourCategory = document.getElementById('tour-category');

    if (tourTitle) this.bookingSummary.tourName = tourTitle.textContent;
    if (tourCategory) this.bookingSummary.duration = tourCategory.textContent;
    if (tourPrice) {
      const priceText = tourPrice.textContent.replace(/[^0-9,]/g, '');
      this.bookingSummary.totalAmount = parseInt(priceText.replace(/,/g, '')) || 85000;
    }

    this.bookingSummary.depositAmount = Math.ceil(this.bookingSummary.totalAmount * 0.2);
    this.updateBookingSummary();
  }

  // Update booking summary display
  updateBookingSummary() {
    const summaryAmount = document.getElementById('summary-total-amount');
    const summaryDeposit = document.getElementById('summary-deposit-amount');
    const summaryGuests = document.getElementById('summary-guests');
    const summaryTourName = document.getElementById('summary-tour-name');
    const summaryDuration = document.getElementById('summary-duration');

    if (summaryTourName) {
      summaryTourName.textContent = this.bookingSummary.tourName || 'Your Tour';
    }

    if (summaryDuration) {
      summaryDuration.textContent = this.bookingSummary.duration || 'Multiple Days';
    }

    if (summaryAmount) {
      const displayAmount = this.bookingSummary.isDeposit 
        ? this.bookingSummary.depositAmount 
        : this.bookingSummary.totalAmount;
      summaryAmount.textContent = `KSh ${displayAmount.toLocaleString()}`;
    }

    if (this.bookingSummary.isDeposit && summaryDeposit) {
      summaryDeposit.textContent = `KSh ${this.bookingSummary.depositAmount.toLocaleString()}`;
    }
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

    this.showLoading(statusEl, 'Sending STK Push...');

    try {
      const amount = this.bookingSummary.isDeposit 
        ? this.bookingSummary.depositAmount 
        : this.bookingSummary.totalAmount;

      const response = await fetch('/.netlify/functions/create-mpesa-stk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phoneInput.value,
          amount: amount,
          tour: this.bookingSummary.tourName
        })
      });

      const data = await response.json();

      if (response.ok) {
        this.showSuccess(statusEl, 'STK Push sent! Check your phone for the prompt.');
      } else {
        this.showError(statusEl, data.error || 'Payment initiation failed');
      }
    } catch (error) {
      console.error('M-Pesa error:', error);
      this.showError(statusEl, 'Network error. Please try again.');
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

    this.showLoading(statusEl, 'Processing payment...');

    try {
      const cardNumber = form.querySelector('input[name="card-number"]').value.replace(/\s/g, '');

      if (!this.validateCard(cardNumber)) {
        this.showError(statusEl, 'Invalid card number');
        return;
      }

      const amount = this.bookingSummary.isDeposit 
        ? this.bookingSummary.depositAmount 
        : this.bookingSummary.totalAmount;

      const response = await fetch('/.netlify/functions/create-stripe-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amount,
          tour: this.bookingSummary.tourName,
          cardholder: cardholder.value
        })
      });

      const data = await response.json();

      if (response.ok && data.url) {
        window.location.href = data.url;
      } else {
        this.showError(statusEl, data.error || 'Payment failed');
      }
    } catch (error) {
      console.error('Stripe error:', error);
      this.showError(statusEl, 'Payment processing failed');
    }
  }

  // Handle PayPal payment
  async handlePayPalPayment() {
    try {
      const amount = this.bookingSummary.isDeposit 
        ? this.bookingSummary.depositAmount 
        : this.bookingSummary.totalAmount;

      const response = await fetch('/.netlify/functions/create-paypal-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amount,
          tour: this.bookingSummary.tourName
        })
      });

      const data = await response.json();

      if (response.ok && data.approvalUrl) {
        window.location.href = data.approvalUrl;
      }
    } catch (error) {
      console.error('PayPal error:', error);
      alert('PayPal payment initiation failed');
    }
  }

  // Handle PesaPal payment
  async handlePesapalPayment() {
    try {
      const amount = this.bookingSummary.isDeposit 
        ? this.bookingSummary.depositAmount 
        : this.bookingSummary.totalAmount;

      const response = await fetch('/.netlify/functions/create-pesapal-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amount,
          tour: this.bookingSummary.tourName
        })
      });

      const data = await response.json();

      if (response.ok && data.redirectUrl) {
        window.location.href = data.redirectUrl;
      }
    } catch (error) {
      console.error('PesaPal error:', error);
      alert('PesaPal payment initiation failed');
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

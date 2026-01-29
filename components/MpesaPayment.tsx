
import React, { useState, useEffect } from 'react';

interface PaymentModalProps {
  amount: number;
  experienceTitle: string;
  onSuccess: () => void;
  onCancel: () => void;
}

type Provider = 'mpesa' | 'airtel' | 'card';

const MpesaPayment: React.FC<PaymentModalProps> = ({ amount, experienceTitle, onSuccess, onCancel }) => {
  const [provider, setProvider] = useState<Provider | null>(null);
  const [phone, setPhone] = useState('');
  const [step, setStep] = useState<'selection' | 'input' | 'processing' | 'waiting' | 'success'>('selection');
  // Reduced to 15s for a better demo flow
  const [timer, setTimer] = useState(15);

  useEffect(() => {
    let interval: any;
    if (step === 'waiting' && timer > 0) {
      interval = setInterval(() => setTimer(prev => prev - 1), 1000);
    } else if (timer === 0 && step === 'waiting') {
      setStep('success');
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  const handleMobilePayment = (e: React.FormEvent) => {
    e.preventDefault();
    // More flexible regex for Kenyan numbers
    if (!phone.match(/^(?:254|\+254|0)?([71])[0-9]{8}$/)) {
      alert('Please enter a valid Kenyan number (e.g., 0712345678)');
      return;
    }
    setStep('processing');
    setTimeout(() => setStep('waiting'), 1500);
  };

  const handleCardPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('processing');
    setTimeout(() => setStep('success'), 2500);
  };

  const providerStyles = {
    mpesa: { bg: 'bg-mpesa', text: 'text-mpesa', label: 'Lipa na M-PESA', icon: 'M' },
    airtel: { bg: 'bg-[#E11900]', text: 'text-[#E11900]', label: 'Airtel Money', icon: 'A' },
    card: { bg: 'bg-zipton-brown', text: 'text-zipton-brown', label: 'Card Payment', icon: '💳' }
  };

  const currentStyle = provider ? providerStyles[provider] : null;

  return (
    <div className="fixed inset-0 bg-zipton-black/90 z-[100] flex items-center justify-center p-4 backdrop-blur-md transition-all">
      <div className="bg-white w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl relative animate-scale-in">
        
        {/* Header */}
        <div className={`${currentStyle?.bg || 'bg-zipton-brown'} p-6 text-white transition-colors`}>
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center font-bold">{currentStyle?.icon || 'Z'}</div>
              <p className="font-bold text-lg">{currentStyle?.label || 'Zipton Secure Checkout'}</p>
            </div>
            <button onClick={onCancel} className="bg-black/10 hover:bg-black/20 p-2 rounded-full">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>

        <div className="p-8">
          {step === 'selection' && (
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 mb-6">
                <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Booking For</p>
                <h4 className="text-zipton-brown font-bold text-lg mb-2">{experienceTitle}</h4>
                <p className="text-3xl font-black text-zipton-orange">KES {(amount * 130).toLocaleString()}</p>
              </div>
              
              <div className="grid grid-cols-1 gap-3">
                <button onClick={() => { setProvider('mpesa'); setStep('input'); }} className="flex items-center justify-between p-4 border-2 border-gray-100 rounded-2xl hover:border-mpesa hover:bg-mpesa/5 transition-all group">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-mpesa rounded-lg flex items-center justify-center text-white font-bold">M</div>
                    <span className="font-bold text-zipton-brown">M-Pesa</span>
                  </div>
                  <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>
                <button onClick={() => { setProvider('airtel'); setStep('input'); }} className="flex items-center justify-between p-4 border-2 border-gray-100 rounded-2xl hover:border-[#E11900] hover:bg-[#E11900]/5 transition-all group">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-[#E11900] rounded-lg flex items-center justify-center text-white font-bold">A</div>
                    <span className="font-bold text-zipton-brown">Airtel Money</span>
                  </div>
                  <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>
                <button onClick={() => { setProvider('card'); setStep('input'); }} className="flex items-center justify-between p-4 border-2 border-gray-100 rounded-2xl hover:border-zipton-brown hover:bg-zipton-brown/5 transition-all group">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-zipton-brown rounded-lg flex items-center justify-center text-white text-lg">💳</div>
                    <span className="font-bold text-zipton-brown">Card Payment</span>
                  </div>
                  <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>
            </div>
          )}

          {step === 'input' && (
            <div className="animate-fade-in">
              <button onClick={() => setStep('selection')} className="text-gray-400 hover:text-zipton-brown text-sm font-bold flex items-center space-x-1 mb-6">
                <span>← Change Method</span>
              </button>
              {provider === 'card' ? (
                <form onSubmit={handleCardPayment} className="space-y-4">
                  <input required placeholder="Card Number" className="w-full px-5 py-3 bg-gray-50 border-2 border-transparent focus:border-zipton-brown outline-none rounded-xl" />
                  <div className="grid grid-cols-2 gap-4">
                    <input required placeholder="MM/YY" className="w-full px-5 py-3 bg-gray-50 border-2 border-transparent focus:border-zipton-brown outline-none rounded-xl" />
                    <input required placeholder="CVC" className="w-full px-5 py-3 bg-gray-50 border-2 border-transparent focus:border-zipton-brown outline-none rounded-xl" />
                  </div>
                  <button type="submit" className="w-full bg-zipton-brown text-white py-4 rounded-xl font-bold mt-4 shadow-lg">Pay KES {(amount * 130).toLocaleString()}</button>
                </form>
              ) : (
                <form onSubmit={handleMobilePayment} className="space-y-4">
                  <label className="text-sm font-bold text-zipton-brown block ml-1">Phone Number</label>
                  <input value={phone} onChange={(e) => setPhone(e.target.value)} required placeholder="0712 345 678" className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:border-zipton-orange outline-none rounded-xl text-xl font-bold" />
                  <button type="submit" className={`w-full ${currentStyle?.bg} text-white py-5 rounded-xl font-bold text-lg mt-4 shadow-lg`}>Initiate STK Push</button>
                </form>
              )}
            </div>
          )}

          {step === 'processing' && (
            <div className="py-20 text-center flex flex-col items-center">
              <div className={`w-16 h-16 border-4 border-gray-100 border-t-zipton-orange rounded-full animate-spin mb-6`}></div>
              <h3 className="text-xl font-bold text-zipton-brown">Connecting to Gateway...</h3>
            </div>
          )}

          {step === 'waiting' && (
            <div className="py-12 text-center flex flex-col items-center">
              <div className="w-20 h-20 bg-gray-50 rounded-2xl flex items-center justify-center mb-6 animate-pulse">
                <svg className={`w-10 h-10 ${currentStyle?.text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
              </div>
              <h3 className="text-xl font-bold text-zipton-brown mb-2">Check Your Phone</h3>
              <p className="text-gray-500 mb-6">Enter your PIN to authorize the payment.</p>
              <div className={`font-black text-4xl ${currentStyle?.text}`}>00:{timer < 10 ? `0${timer}` : timer}</div>
            </div>
          )}

          {step === 'success' && (
            <div className="py-12 text-center flex flex-col items-center animate-scale-in">
              <div className={`${currentStyle?.bg} w-20 h-20 rounded-full flex items-center justify-center text-white mb-6 shadow-xl`}>
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg>
              </div>
              <h3 className="text-2xl font-black text-zipton-brown mb-2">Safari Booked!</h3>
              <p className="text-gray-500 mb-8 px-6 text-sm">Your payment was confirmed. A welcome packet has been sent to your email.</p>
              <button onClick={onSuccess} className="w-full bg-zipton-orange text-white py-4 rounded-xl font-bold hover:shadow-lg transition-all">Finish Checkout</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MpesaPayment;

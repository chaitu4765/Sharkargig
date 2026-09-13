import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, ShieldCheck, QrCode, CreditCard, Landmark, CheckCircle2, Lock, ArrowRight, Smartphone } from 'lucide-react';

export const PaymentGatewayModal = ({ booking, onClose, onSuccess }) => {
  const { t } = useAuth();
  const [paymentTab, setPaymentTab] = useState('upi'); // 'upi' | 'card' | 'netbanking' | 'cash'
  const [upiId, setUpiId] = useState('customer@okicici');
  const [cardNumber, setCardNumber] = useState('4532 8921 4452 8892');
  const [cardExpiry, setCardExpiry] = useState('08/28');
  const [cardCvv, setCardCvv] = useState('492');
  const [selectedBank, setSelectedBank] = useState('TS_COOP_BANK');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [txnResult, setTxnResult] = useState(null);

  const amount = booking ? booking.total_amount : 750;

  const handleProcessPayment = async (e) => {
    e.preventDefault();
    setIsProcessing(true);

    // Simulate 1.5s gateway handshake
    setTimeout(async () => {
      try {
        const res = await fetch('/api/payments/process', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('sahakar_token')}`
          },
          body: JSON.stringify({
            booking_id: booking.id,
            payment_method: paymentTab.toUpperCase()
          })
        });
        const data = await res.json();
        setIsProcessing(false);

        if (data.success) {
          setIsSuccess(true);
          setTxnResult(data.payment);
          setTimeout(() => {
            onSuccess(data);
          }, 1800);
        } else {
          alert(data.message);
        }
      } catch (err) {
        setIsProcessing(false);
        alert('Payment processing failed. Please try again.');
      }
    }, 1500);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card" style={{ maxWidth: '600px', padding: '0', overflow: 'hidden' }}>
        {/* Gateway Header */}
        <div style={{ background: '#0f172a', color: '#fff', padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '3px solid #ea580c' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck color="#ea580c" size={24} />
              <h3 style={{ margin: 0, color: '#fff', fontSize: '1.1rem' }}>
                SahakarGig Payment Gateway
              </h3>
            </div>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.75rem', color: '#94a3b8' }}>
              256-bit SSL Encrypted • Labour Cooperative Gateway
            </p>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Amount to Pay</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#22c55e' }}>₹{amount}.00</div>
          </div>
        </div>

        {/* Order Details Ribbon */}
        <div style={{ background: '#f8fafc', padding: '0.75rem 1.5rem', borderBottom: '1px solid #e2e8f0', fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
          <div>
            Booking ID: <strong style={{ color: '#0f172a' }}>#{booking?.booking_number}</strong>
          </div>
          <div>
            Worker: <strong style={{ color: '#0f172a' }}>{booking?.worker_name}</strong>
          </div>
        </div>

        {/* Success View */}
        {isSuccess ? (
          <div style={{ padding: '3rem 1.5rem', textAlign: 'center' }}>
            <CheckCircle2 size={64} color="#16a34a" style={{ margin: '0 auto 1rem auto', animation: 'scaleUp 0.3s ease-out' }} />
            <h2 style={{ color: '#15803d', margin: 0 }}>Payment Successful!</h2>
            <p style={{ fontSize: '0.9rem', color: '#475569', margin: '0.4rem 0 1rem 0' }}>
              Transaction Ref: <strong>{txnResult?.transaction_ref}</strong>
            </p>
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '0.75rem', borderRadius: '8px', fontSize: '0.85rem', color: '#166534', maxWidth: '350px', margin: '0 auto' }}>
              ✓ Digital Tax Invoice Generated<br />
              ✓ Worker Wallet Credited Instant Payout (85%)
            </div>
          </div>
        ) : isProcessing ? (
          /* Processing View */
          <div style={{ padding: '3.5rem 1.5rem', textAlign: 'center' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                border: '4px solid #fed7aa',
                borderTopColor: '#ea580c',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 1.5rem auto'
              }}
            />
            <h3 style={{ margin: 0, color: '#0f172a' }}>Processing Secure Payment...</h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.5rem' }}>
              Connecting to Bank Gateway & Verifying UPI PIN... Please do not close this window.
            </p>
            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          </div>
        ) : (
          /* Payment Method Selector View */
          <div style={{ padding: '1.25rem 1.5rem' }}>
            <form onSubmit={handleProcessPayment}>
              {/* Tabs */}
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setPaymentTab('upi')}
                  style={{
                    flex: 1,
                    padding: '0.5rem',
                    borderRadius: '6px',
                    border: paymentTab === 'upi' ? '2px solid #ea580c' : '1px solid #cbd5e1',
                    background: paymentTab === 'upi' ? '#fff7ed' : '#fff',
                    color: paymentTab === 'upi' ? '#c2410c' : '#475569',
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem'
                  }}
                >
                  <Smartphone size={16} /> Instant UPI / QR
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentTab('card')}
                  style={{
                    flex: 1,
                    padding: '0.5rem',
                    borderRadius: '6px',
                    border: paymentTab === 'card' ? '2px solid #ea580c' : '1px solid #cbd5e1',
                    background: paymentTab === 'card' ? '#fff7ed' : '#fff',
                    color: paymentTab === 'card' ? '#c2410c' : '#475569',
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem'
                  }}
                >
                  <CreditCard size={16} /> Credit / Debit Card
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentTab('netbanking')}
                  style={{
                    flex: 1,
                    padding: '0.5rem',
                    borderRadius: '6px',
                    border: paymentTab === 'netbanking' ? '2px solid #ea580c' : '1px solid #cbd5e1',
                    background: paymentTab === 'netbanking' ? '#fff7ed' : '#fff',
                    color: paymentTab === 'netbanking' ? '#c2410c' : '#475569',
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem'
                  }}
                >
                  <Landmark size={16} /> Net Banking
                </button>
              </div>

              {/* UPI Options */}
              {paymentTab === 'upi' && (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
                    {/* Simulated QR Code */}
                    <div style={{ background: '#fff', border: '2px solid #e2e8f0', borderRadius: '10px', padding: '0.75rem', textAlign: 'center' }}>
                      <div style={{ background: '#0f172a', color: '#fff', padding: '0.2rem', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                        SCAN QR CODE TO PAY
                      </div>
                      <div style={{ width: '100px', height: '100px', margin: '0 auto', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed #94a3b8' }}>
                        <QrCode size={70} color="#0f172a" />
                      </div>
                      <div style={{ fontSize: '0.65rem', color: '#64748b', marginTop: '0.4rem' }}>
                        GPay • PhonePe • Paytm • BHIM
                      </div>
                    </div>

                    {/* VPA Input */}
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '0.3rem' }}>
                        Enter UPI ID / VPA
                      </label>
                      <input
                        className="input-field"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        placeholder="e.g. mobile@upi"
                        required
                        style={{ marginBottom: '0.75rem' }}
                      />

                      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                        {['@okicici', '@ybl', '@paytm', '@sbi'].map((handle) => (
                          <button
                            key={handle}
                            type="button"
                            onClick={() => setUpiId(`user${handle}`)}
                            style={{ fontSize: '0.7rem', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '0.2rem 0.4rem', cursor: 'pointer' }}
                          >
                            {handle}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* CARD Options */}
              {paymentTab === 'card' && (
                <div>
                  <div style={{ marginBottom: '0.75rem' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '0.2rem' }}>
                      Card Number
                    </label>
                    <input
                      className="input-field"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      placeholder="4532 0000 0000 0000"
                      required
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '0.2rem' }}>
                        Expiry Date
                      </label>
                      <input
                        className="input-field"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        placeholder="MM/YY"
                        required
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '0.2rem' }}>
                        CVV / CVC
                      </label>
                      <input
                        type="password"
                        className="input-field"
                        maxLength={4}
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value)}
                        placeholder="•••"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* NETBANKING Options */}
              {paymentTab === 'netbanking' && (
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '0.3rem' }}>
                    Select Bank Account
                  </label>
                  <select
                    className="input-field"
                    value={selectedBank}
                    onChange={(e) => setSelectedBank(e.target.value)}
                  >
                    <option value="TS_COOP_BANK">Telangana State Apex Cooperative Bank</option>
                    <option value="SBI">State Bank of India (SBI)</option>
                    <option value="HDFC">HDFC Bank</option>
                    <option value="ICICI">ICICI Bank</option>
                    <option value="AXIS">Axis Bank</option>
                    <option value="AP_COOP_BANK">Andhra Pradesh State Cooperative Bank</option>
                  </select>
                </div>
              )}

              {/* Bottom Submit Action */}
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
                <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={onClose}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 2, background: '#16a34a', fontSize: '0.95rem' }}
                >
                  <Lock size={16} /> Pay ₹{amount}.00 Securely
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

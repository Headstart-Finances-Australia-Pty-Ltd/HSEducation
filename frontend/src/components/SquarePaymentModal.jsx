import { useEffect, useRef, useState } from 'react';
import Modal from './Modal';
import Icon from './Icon';
import { getSquarePayments, isSquareConfigured } from '../square';

// Popup for entering payment details via Square's hosted, PCI-compliant
// fields. We never see or store the raw card/bank number — Square's SDK
// tokenizes it into a one-time-use "nonce" that the backend exchanges for
// an actual charge via the Square Payments API.
const SquarePaymentModal = ({ open, amount, frequency, onClose, onTokenized }) => {
  const [method, setMethod]   = useState('card');   // 'card' | 'bank'
  const [ready, setReady]     = useState(false);
  const [bankAvailable, setBankAvailable] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]     = useState('');

  const paymentsRef = useRef(null);
  const cardRef      = useRef(null);
  const bankRef       = useRef(null);
  const cardMounted   = useRef(false);
  const bankMounted    = useRef(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setReady(false);
    setError('');

    (async () => {
      try {
        const payments = await getSquarePayments();
        paymentsRef.current = payments;

        // Card (debit/credit) — always supported by Square.
        const card = await payments.card();
        await card.attach('#sq-card-container');
        cardRef.current = card;
        cardMounted.current = true;

        // Bank account (ACH) — only available on some Square accounts/regions.
        // We try it, and simply hide the tab if it's not supported rather
        // than showing an error, since this is an optional extra.
        try {
          const bankAccount = await payments.bankAccount();
          await bankAccount.attach('#sq-bank-container');
          bankRef.current = bankAccount;
          bankMounted.current = true;
          if (!cancelled) setBankAvailable(true);
        } catch (bankErr) {
          console.warn('Bank account payments not available on this Square account:', bankErr.message);
        }

        if (!cancelled) setReady(true);
      } catch (err) {
        if (!cancelled) setError(err.message || 'Could not load the Square payment form.');
      }
    })();

    return () => {
      cancelled = true;
      if (cardMounted.current && cardRef.current) { cardRef.current.destroy(); cardMounted.current = false; }
      if (bankMounted.current && bankRef.current) { bankRef.current.destroy(); bankMounted.current = false; }
      cardRef.current = null;
      bankRef.current = null;
      setMethod('card');
      setBankAvailable(false);
    };
  }, [open]);

  const handlePay = async () => {
    setError('');
    const instance = method === 'bank' ? bankRef.current : cardRef.current;
    if (!instance) {
      setError('Payment form is not ready yet — please wait a moment and try again.');
      return;
    }
    setSubmitting(true);
    try {
      const result = await instance.tokenize();
      if (result.status === 'OK') {
        onTokenized({ token: result.token, method });
      } else {
        const msg = (result.errors || []).map(e => e.message).join(' ') || 'Could not process those details.';
        setError(msg);
      }
    } catch (err) {
      setError(err.message || 'Something went wrong while processing your payment details.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={submitting ? undefined : onClose} title="Secure Payment" width={460}>
      {!isSquareConfigured && (
        <div className="payment-notice">
          ⚠️ Square is not configured yet. Add <code>REACT_APP_SQUARE_APPLICATION_ID</code> and{' '}
          <code>REACT_APP_SQUARE_LOCATION_ID</code> to <code>frontend/.env</code> — see README for setup steps.
          This form will not be able to take a real payment until that's done.
        </div>
      )}

      <div className="donate-summary">
        Donating <strong>${amount}</strong>{frequency !== 'once' ? ` / ${frequency === 'monthly' ? 'month' : 'year'}` : ''}
      </div>

      <div className="pay-method-tabs">
        <button
          className={`pay-method-tab${method === 'card' ? ' active' : ''}`}
          onClick={() => setMethod('card')}
          type="button"
        >
          <Icon name="lock" size={14} /> Credit / Debit Card
        </button>
        {bankAvailable && (
          <button
            className={`pay-method-tab${method === 'bank' ? ' active' : ''}`}
            onClick={() => setMethod('bank')}
            type="button"
          >
            🏦 Bank Account
          </button>
        )}
      </div>

      {!ready && !error && <div className="payment-loading">Loading secure payment form…</div>}

      {/* Both containers stay mounted so Square's iframes don't get re-created;
          we just show/hide with CSS so tokenization keeps working. */}
      <div style={{ display: method === 'card' ? 'block' : 'none' }}>
        <div id="sq-card-container" className="sq-field-container" />
      </div>
      <div style={{ display: method === 'bank' ? 'block' : 'none' }}>
        <div id="sq-bank-container" className="sq-field-container" />
      </div>

      {error && <div className="payment-error">{error}</div>}

      <button className="donate-btn" onClick={handlePay} disabled={!ready || submitting} style={{ opacity: !ready || submitting ? 0.7 : 1 }}>
        {submitting ? '⏳ Processing…' : `🔒 Pay $${amount}`}
      </button>
      <div className="payment-footnote">
        <Icon name="lock" size={13} /> Payments are processed securely by Square. We never see or store your card or bank details.
      </div>
    </Modal>
  );
};

export default SquarePaymentModal;

import React from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Printer, ShieldCheck } from 'lucide-react';

export const InvoiceModal = ({ invoice, onClose }) => {
  const { t } = useAuth();
  if (!invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card" style={{ maxWidth: '650px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldCheck size={24} color="#ea580c" />
            <h2 style={{ fontSize: '1.2rem', margin: 0 }}>{t('digital_invoice')}</h2>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-outline" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }} onClick={handlePrint}>
              <Printer size={14} /> {t('print_pdf')}
            </button>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="invoice-box">
          <div style={{ textAlign: 'center', borderBottom: '2px solid #0f172a', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', textTransform: 'uppercase' }}>
              {invoice.society_name || 'Telangana Labour Cooperative Society'}
            </h3>
            <p style={{ fontSize: '0.75rem', color: '#475569', margin: 0 }}>
              Reg No: {invoice.society_reg || 'HYD-COOP-2018-091'} • Government Registered Labour Society
            </p>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, marginTop: '0.4rem', color: '#ea580c' }}>
              INVOICE NO: {invoice.invoice_number}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.8rem', marginBottom: '1rem' }}>
            <div>
              <strong>{t('customer_details')}:</strong>
              <div>{invoice.customer_name}</div>
              <div>Phone: {invoice.customer_phone}</div>
              <div>Address: {invoice.service_address}</div>
            </div>
            <div>
              <strong>{t('service_details')}:</strong>
              <div>Service: {t(invoice.service_name)}</div>
              <div>Worker: {invoice.worker_name}</div>
              <div>Date: {invoice.scheduled_date}</div>
            </div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', marginBottom: '1rem' }}>
            <thead>
              <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
                <th style={{ textAlign: 'left', padding: '0.4rem' }}>{t('description')}</th>
                <th style={{ textAlign: 'right', padding: '0.4rem' }}>{t('amount')}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: '0.4rem', borderBottom: '1px dashed #e2e8f0' }}>{t('service_labour_charge')}</td>
                <td style={{ textAlign: 'right', padding: '0.4rem', borderBottom: '1px dashed #e2e8f0' }}>₹{invoice.service_charge}.00</td>
              </tr>
              {invoice.material_charge > 0 && (
                <tr>
                  <td style={{ padding: '0.4rem', borderBottom: '1px dashed #e2e8f0' }}>{t('material_spare_charge')}</td>
                  <td style={{ textAlign: 'right', padding: '0.4rem', borderBottom: '1px dashed #e2e8f0' }}>₹{invoice.material_charge}.00</td>
                </tr>
              )}
              <tr>
                <td style={{ padding: '0.4rem', borderBottom: '1px dashed #e2e8f0' }}>{t('coop_welfare_cess')}</td>
                <td style={{ textAlign: 'right', padding: '0.4rem', borderBottom: '1px dashed #e2e8f0' }}>₹{invoice.tax_amount}.00</td>
              </tr>
            </tbody>
            <tfoot>
              <tr style={{ fontWeight: 800, fontSize: '0.95rem', borderTop: '2px solid #0f172a' }}>
                <td style={{ padding: '0.5rem' }}>{t('total_paid')}:</td>
                <td style={{ textAlign: 'right', padding: '0.5rem', color: '#16a34a' }}>₹{invoice.total_amount}.00</td>
              </tr>
            </tfoot>
          </table>

          <div style={{ textAlign: 'center', fontSize: '0.7rem', color: '#64748b', marginTop: '1rem', borderTop: '1px solid #e2e8f0', paddingTop: '0.5rem' }}>
            Thank you for supporting Labour Cooperatives & Dignified Workers' Livelihood.
          </div>
        </div>
      </div>
    </div>
  );
};

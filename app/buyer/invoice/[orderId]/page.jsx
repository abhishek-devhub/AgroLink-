'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function InvoicePage({ params }) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [invoice, setInvoice] = useState(null);
    const [error, setError] = useState(null);
    const [generating, setGenerating] = useState(false);
    const [orderId, setOrderId] = useState(null);

    useEffect(() => {
        (async () => {
            const resolvedParams = await params;
            setOrderId(resolvedParams.orderId);
        })();
    }, [params]);

    useEffect(() => {
        if (!loading && (!user || user.role !== 'buyer')) {
            router.push('/login');
        }
    }, [user, loading, router]);

    useEffect(() => {
        if (!orderId) return;

        const fetchInvoice = async () => {
            try {
                const res = await fetch(`/api/invoice/${orderId}`);
                const data = await res.json();
                if (!data.success) {
                    setError(data.error || 'Failed to load invoice');
                    return;
                }
                setInvoice(data.data);
            } catch (err) {
                setError(err.message);
            }
        };

        fetchInvoice();
    }, [orderId]);

    const generatePDF = async () => {
        try {
            setGenerating(true);

            // Import dynamically at runtime
            const { jsPDF } = await import('jspdf');
            const html2canvas = await import('html2canvas');

            const element = document.getElementById('invoice-content');
            const canvas = await html2canvas.default(element, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff',
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4',
            });

            const ImgWidth = 210; // A4 width in mm
            const ImgHeight = (canvas.height * ImgWidth) / canvas.width;
            let heightLeft = ImgHeight;
            let position = 0;

            pdf.addImage(imgData, 'PNG', 0, position, ImgWidth, ImgHeight);
            heightLeft -= 297; // A4 height in mm

            while (heightLeft >= 0) {
                position = heightLeft - ImgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, ImgWidth, ImgHeight);
                heightLeft -= 297;
            }

            pdf.save(`Invoice-${invoice.invoiceNumber}.pdf`);
            setGenerating(false);
        } catch (err) {
            console.error('PDF generation error:', err);
            setError('Failed to generate PDF: ' + err.message);
            setGenerating(false);
        }
    };

    if (loading || !orderId) return <div className="page-container">Loading...</div>;
    if (error) return <div className="page-container"><div className="card" style={{ color: 'red' }}>❌ Error: {error}</div></div>;
    if (!invoice) return <div className="page-container">Loading invoice...</div>;

    return (
        <div className="page-container" style={{ maxWidth: '900px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 className="page-title">🧾 Invoice</h1>
                <button
                    className="btn-primary"
                    onClick={generatePDF}
                    disabled={generating}
                    style={{ fontSize: '0.9rem' }}
                >
                    {generating ? '⏳ Generating PDF...' : '📥 Download PDF'}
                </button>
            </div>

            <div
                id="invoice-content"
                className="card"
                style={{
                    background: 'white',
                    padding: '3rem',
                    marginBottom: '2rem',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                }}
            >
                {/* Header */}
                <div style={{ borderBottom: '2px solid var(--leaf)', paddingBottom: '2rem', marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <div>
                            <h2 style={{ color: 'var(--soil)', margin: 0, fontSize: '1.8rem' }}>🌾 AgroLink</h2>
                            <p style={{ color: 'var(--bark)', margin: '0.5rem 0 0 0', fontSize: '0.9rem' }}>Direct Farm-to-Table Solutions</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <p style={{ color: 'var(--bark)', margin: '0.5rem 0', fontSize: '0.95rem' }}>
                                <strong>Invoice No:</strong> {invoice.invoiceNumber}
                            </p>
                            <p style={{ color: 'var(--bark)', margin: '0.5rem 0', fontSize: '0.95rem' }}>
                                <strong>Date:</strong> {invoice.invoiceDate}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Party Details */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                    {/* Farmer Details */}
                    <div>
                        <h4 style={{ color: 'var(--soil)', fontSize: '0.95rem', margin: '0 0 0.75rem 0', textTransform: 'uppercase' }}>From (Supplier)</h4>
                        <div style={{ background: '#f9f9f9', padding: '1rem', borderRadius: '8px', fontSize: '0.9rem', color: 'var(--bark)' }}>
                            <p style={{ margin: '0.5rem 0', fontWeight: 600 }}>{invoice.farmerName}</p>
                            <p style={{ margin: '0.3rem 0' }}>{invoice.farmerDistrict}, {invoice.farmerState}</p>
                        </div>
                    </div>

                    {/* Buyer Details */}
                    <div>
                        <h4 style={{ color: 'var(--soil)', fontSize: '0.95rem', margin: '0 0 0.75rem 0', textTransform: 'uppercase' }}>To (Buyer)</h4>
                        <div style={{ background: '#f9f9f9', padding: '1rem', borderRadius: '8px', fontSize: '0.9rem', color: 'var(--bark)' }}>
                            <p style={{ margin: '0.5rem 0', fontWeight: 600 }}>{invoice.buyerName}</p>
                            <p style={{ margin: '0.3rem 0', fontSize: '0.85rem' }}>Buyer ID: {invoice.buyerId}</p>
                        </div>
                    </div>
                </div>

                {/* Order Details */}
                <div style={{ marginBottom: '2rem' }}>
                    <h4 style={{ color: 'var(--soil)', fontSize: '0.95rem', margin: '0 0 1rem 0', textTransform: 'uppercase' }}>Order Details</h4>
                    <div style={{ borderCollapse: 'collapse', width: '100%' }}>
                        <table style={{
                            width: '100%',
                            fontSize: '0.9rem',
                            borderCollapse: 'collapse',
                        }}>
                            <thead>
                                <tr style={{
                                    background: 'var(--leaf)',
                                    color: 'white',
                                    fontWeight: 600,
                                }}>
                                    <th style={{ padding: '0.75rem', textAlign: 'left', borderRadius: '4px 0 0 0' }}>Item</th>
                                    <th style={{ padding: '0.75rem', textAlign: 'center' }}>Variety</th>
                                    <th style={{ padding: '0.75rem', textAlign: 'center' }}>Grade</th>
                                    <th style={{ padding: '0.75rem', textAlign: 'center' }}>Qty</th>
                                    <th style={{ padding: '0.75rem', textAlign: 'right' }}>Unit Price</th>
                                    <th style={{ padding: '0.75rem', textAlign: 'right', borderRadius: '0 4px 0 0' }}>Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={{ padding: '1rem 0.75rem', fontWeight: 600, color: 'var(--soil)' }}>{invoice.crop}</td>
                                    <td style={{ padding: '1rem 0.75rem', textAlign: 'center', color: 'var(--bark)' }}>{invoice.variety}</td>
                                    <td style={{ padding: '1rem 0.75rem', textAlign: 'center', color: 'var(--bark)' }}>{invoice.grade}</td>
                                    <td style={{ padding: '1rem 0.75rem', textAlign: 'center', fontWeight: 600, color: 'var(--bark)' }}>
                                        {invoice.quantity} {invoice.unit}
                                    </td>
                                    <td style={{ padding: '1rem 0.75rem', textAlign: 'right', color: 'var(--bark)' }}>
                                        ₹{invoice.agreedPrice.toLocaleString('en-IN')}
                                    </td>
                                    <td style={{ padding: '1rem 0.75rem', textAlign: 'right', fontWeight: 600, color: 'var(--leaf)', fontSize: '1rem' }}>
                                        ₹{invoice.totalAmount.toLocaleString('en-IN')}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Amount Summary */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    marginBottom: '2rem',
                    marginTop: '2rem',
                    paddingTop: '1rem',
                    borderTop: '1px solid #eee',
                }}>
                    <div style={{ width: '100%', maxWidth: '350px' }}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            padding: '0.75rem 0',
                            fontSize: '0.95rem',
                            color: 'var(--bark)',
                        }}>
                            <span>Subtotal:</span>
                            <span>₹{invoice.totalAmount.toLocaleString('en-IN')}</span>
                        </div>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            padding: '0.75rem 0',
                            fontSize: '0.95rem',
                            color: 'var(--bark)',
                        }}>
                            <span>Tax (0%):</span>
                            <span>₹0</span>
                        </div>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            padding: '1rem 0',
                            fontSize: '1.1rem',
                            fontWeight: 600,
                            color: 'var(--soil)',
                            borderTop: '2px solid var(--leaf)',
                            borderBottom: '2px solid var(--leaf)',
                        }}>
                            <span>Total Amount:</span>
                            <span style={{ color: 'var(--leaf)' }}>₹{invoice.totalAmount.toLocaleString('en-IN')}</span>
                        </div>
                    </div>
                </div>

                {/* Payment Confirmation */}
                <div style={{
                    background: '#d4edda',
                    border: '2px solid var(--leaf)',
                    borderRadius: '8px',
                    padding: '1.5rem',
                    marginBottom: '2rem',
                }}>
                    <h4 style={{
                        color: 'var(--soil)',
                        margin: '0 0 1rem 0',
                        fontSize: '0.95rem',
                        textTransform: 'uppercase',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                    }}>
                        ✅ Payment Confirmation
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.9rem', color: 'var(--bark)' }}>
                        <div>
                            <p style={{ margin: '0.5rem 0' }}>
                                <strong>Payment Status:</strong> <span style={{ color: 'var(--leaf)', fontWeight: 600 }}>{invoice.paymentStatus}</span>
                            </p>
                            <p style={{ margin: '0.5rem 0' }}>
                                <strong>Payment Method:</strong> {invoice.paymentMethod}
                            </p>
                        </div>
                        <div>
                            {invoice.paidAt && (
                                <p style={{ margin: '0.5rem 0' }}>
                                    <strong>Payment Date:</strong> {invoice.paidAt}
                                </p>
                            )}
                            <p style={{ margin: '0.5rem 0' }}>
                                <strong>Transaction ID:</strong> {invoice.razorpayPaymentId}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div style={{
                    borderTop: '1px solid #ddd',
                    paddingTop: '1.5rem',
                    marginTop: '2rem',
                    fontSize: '0.85rem',
                    color: 'var(--bark)',
                    textAlign: 'center',
                }}>
                    <p style={{ margin: '0.5rem 0' }}>Thank you for your order! 🌾</p>
                    <p style={{ margin: '0.5rem 0', fontSize: '0.8rem' }}>This is a digital invoice generated by AgroLink. For support, contact us anytime.</p>
                    <p style={{ margin: '1rem 0 0 0', fontSize: '0.75rem', color: '#999' }}>
                        Generated on {new Date().toLocaleDateString('en-IN')} at {new Date().toLocaleTimeString('en-IN')}
                    </p>
                </div>
            </div>

            <div style={{
                display: 'flex',
                gap: '1rem',
                justifyContent: 'center',
                marginTop: '1rem',
            }}>
                <button
                    className="btn-secondary"
                    onClick={() => router.back()}
                    style={{ fontSize: '0.9rem' }}
                >
                    ← Back to Orders
                </button>
                <button
                    className="btn-primary"
                    onClick={generatePDF}
                    disabled={generating}
                    style={{ fontSize: '0.9rem' }}
                >
                    {generating ? '⏳ Generating PDF...' : '📥 Download PDF'}
                </button>
            </div>
        </div>
    );
}

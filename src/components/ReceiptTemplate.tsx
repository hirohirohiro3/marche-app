import React from 'react';
import { Order } from '../types';

interface Store {
    storeName?: string;
    invoiceNumber?: string;
}

interface ReceiptTemplateProps {
    order: Order;
    store: Store;
    receiptRef: React.Ref<HTMLDivElement>;
}

export const ReceiptTemplate: React.FC<ReceiptTemplateProps> = ({ order, store, receiptRef }) => {
    if (!order || !store) return null;

    const taxAmount = Math.floor(order.totalPrice - (order.totalPrice / 1.1));
    const createdAt = order.createdAt && 'toDate' in order.createdAt
        ? (order.createdAt as any).toDate()
        : new Date(order.createdAt.seconds * 1000);
    const formattedDate = `${createdAt.getFullYear()}/${String(createdAt.getMonth() + 1).padStart(2, '0')}/${String(createdAt.getDate()).padStart(2, '0')}`;

    return (
        <div style={{ position: 'absolute', top: -9999, left: -9999 }}>
            <div
                ref={receiptRef}
                style={{
                    width: '375px', // Mobile width
                    padding: '40px',
                    backgroundColor: '#ffffff',
                    fontFamily: 'sans-serif',
                    color: '#333',
                    boxSizing: 'border-box'
                }}
            >
                <h2 style={{ textAlign: 'center', margin: '0 0 20px 0', fontSize: '24px' }}>領収書</h2>

                <div style={{ marginBottom: '20px' }}>
                    <h3 style={{ margin: '0 0 5px 0', fontSize: '18px' }}>{store.storeName || 'Marche App'}</h3>
                    {store.invoiceNumber && (
                        <p style={{ margin: '0', fontSize: '14px' }}>登録番号: {store.invoiceNumber}</p>
                    )}
                    <p style={{ margin: '0', fontSize: '14px' }}>発行日: {formattedDate}</p>
                </div>

                <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '20px 0' }} />

                <div style={{ marginBottom: '20px' }}>
                    <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>注文番号: #{order.orderNumber}</h3>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {order.items?.map((item: any, index: number) => (
                            <li key={index} style={{ marginBottom: '10px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px' }}>
                                    <span>{item.name} x {item.quantity}</span>
                                    <span>¥{item.price.toLocaleString()}</span>
                                </div>
                                {item.selectedOptions && item.selectedOptions.length > 0 && (
                                    <ul style={{ listStyle: 'none', padding: '0 0 0 15px', margin: '5px 0 0 0', fontSize: '14px', color: '#666' }}>
                                        {item.selectedOptions.map((opt: any, i: number) => (
                                            <li key={i}>
                                                {opt.groupName}: {opt.choiceName} ({opt.priceModifier >= 0 ? '+' : ''}¥{opt.priceModifier})
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>

                <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '20px 0' }} />

                <div style={{ textAlign: 'right' }}>
                    <h3 style={{ margin: '0 0 5px 0', fontSize: '20px' }}>合計金額: ¥{order.totalPrice.toLocaleString()} (税込)</h3>
                    <p style={{ margin: '0', fontSize: '14px', color: '#666' }}>(内消費税等(10%): ¥{taxAmount.toLocaleString()})</p>
                </div>

                <div style={{ marginTop: '40px', textAlign: 'center', fontSize: '14px', color: '#999' }}>
                    またのご利用をお待ちしております。
                </div>
            </div>
        </div>
    );
};

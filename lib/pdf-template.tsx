import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  Image,
} from '@react-pdf/renderer';
import { Quote, CompanySettings } from './types';

// Define styles for the PDF
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 30,
    fontFamily: 'Helvetica',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    paddingBottom: 20,
    borderBottomWidth: 3,
    borderBottomColor: '#0f766e',
  },
  logo: {
    flexDirection: 'column',
  },
  companyName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f766e',
    marginBottom: 5,
  },
  tagline: {
    fontSize: 12,
    color: '#6b7280',
  },
  quoteInfo: {
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  quoteTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  quoteNumber: {
    fontSize: 14,
    color: '#6b7280',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#374151',
  },
  customerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  customerDetails: {
    flexDirection: 'column',
    width: '45%',
  },
  quoteDetails: {
    flexDirection: 'column',
    width: '45%',
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    width: 100,
    color: '#6b7280',
  },
  detailValue: {
    fontSize: 12,
    color: '#374151',
  },
  table: {
    display: 'flex' as const,
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  tableRow: {
    flexDirection: 'row',
  },
  tableHeader: {
    backgroundColor: '#f9fafb',
  },
  tableCol: {
    width: '20%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderColor: '#e5e7eb',
    padding: 8,
  },
  tableColImage: {
    width: '15%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderColor: '#e5e7eb',
    padding: 8,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  tableColItem: {
    width: '35%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderColor: '#e5e7eb',
    padding: 8,
  },
  productImage: {
    width: 60,
    height: 60,
    objectFit: 'contain' as const,
  },
  tableColQty: {
    width: '15%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderColor: '#e5e7eb',
    padding: 8,
  },
  tableColPrice: {
    width: '25%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderColor: '#e5e7eb',
    padding: 8,
  },
  tableCellHeader: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#374151',
  },
  tableCell: {
    fontSize: 11,
    color: '#6b7280',
    flexWrap: 'wrap' as const,
    wordBreak: 'break-word' as const,
  },
  totalsSection: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
  },
  totalsTable: {
    width: '40%',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  totalRowFinal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: '#f9fafb',
    borderBottomWidth: 2,
    borderBottomColor: '#0f766e',
  },
  totalLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  totalValue: {
    fontSize: 12,
    color: '#374151',
  },
  totalLabelFinal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#374151',
  },
  totalValueFinal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f766e',
  },
  footer: {
    marginTop: 30,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  terms: {
    fontSize: 10,
    color: '#6b7280',
    lineHeight: 1.4,
  },
  footerText: {
    fontSize: 10,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 20,
  },
});

interface QuotePDFProps {
  quote: Quote;
  companySettings: CompanySettings | null;
}

const QuotePDF: React.FC<QuotePDFProps> = ({ quote, companySettings }) => {
  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const validUntilText = quote.validUntil 
    ? formatDate(quote.validUntil)
    : '30 days from receipt';

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logo}>
            <Text style={styles.companyName}>
              {companySettings?.companyName || 'SignatureQuote AI'}
            </Text>
            <Text style={styles.tagline}>
              Professional Solar Equipment Quotes
            </Text>
          </View>
          <View style={styles.quoteInfo}>
            <Text style={styles.quoteTitle}>QUOTE</Text>
            <Text style={styles.quoteNumber}>
              #{quote.number || (quote.id ? quote.id.slice(0, 8) : 'N/A')}
            </Text>
          </View>
        </View>

        {/* Customer and Quote Information */}
        <View style={styles.customerInfo}>
          <View style={styles.customerDetails}>
            <Text style={styles.sectionTitle}>Bill To:</Text>
            {quote.customer.company && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Company:</Text>
                <Text style={styles.detailValue}>{quote.customer.company}</Text>
              </View>
            )}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Name:</Text>
              <Text style={styles.detailValue}>{quote.customer.name}</Text>
            </View>
            {quote.customer.email && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Email:</Text>
                <Text style={styles.detailValue}>{quote.customer.email}</Text>
              </View>
            )}
            {quote.customer.phone && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Phone:</Text>
                <Text style={styles.detailValue}>{quote.customer.phone}</Text>
              </View>
            )}
            {quote.shipTo && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Ship To:</Text>
                <Text style={styles.detailValue}>{quote.shipTo}</Text>
              </View>
            )}
          </View>

          <View style={styles.quoteDetails}>
            <Text style={styles.sectionTitle}>Quote Details:</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Date:</Text>
              <Text style={styles.detailValue}>{formatDate(quote.createdAt)}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Valid Until:</Text>
              <Text style={styles.detailValue}>{validUntilText}</Text>
            </View>
            {quote.preparedBy && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Prepared By:</Text>
                <Text style={styles.detailValue}>{quote.preparedBy}</Text>
              </View>
            )}
            {quote.leadTimeNote && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Lead Time:</Text>
                <Text style={styles.detailValue}>{quote.leadTimeNote}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quote Items</Text>
          <View style={styles.table}>
            {/* Table Header */}
            <View style={[styles.tableRow, styles.tableHeader]}>
              <View style={styles.tableColImage}>
                <Text style={styles.tableCellHeader}>Image</Text>
              </View>
              <View style={styles.tableColItem}>
                <Text style={styles.tableCellHeader}>Item</Text>
              </View>
              <View style={styles.tableColQty}>
                <Text style={styles.tableCellHeader}>Qty</Text>
              </View>
              <View style={styles.tableColPrice}>
                <Text style={styles.tableCellHeader}>Unit Price</Text>
              </View>
              <View style={styles.tableColPrice}>
                <Text style={styles.tableCellHeader}>Total</Text>
              </View>
            </View>

            {/* Table Rows */}
            {quote.items.map((item, index) => (
              <View key={index} style={styles.tableRow}>
                <View style={styles.tableColImage}>
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      style={styles.productImage}
                    />
                  ) : (
                    <Text style={[styles.tableCell, { fontSize: 9, textAlign: 'center' }]}>
                      No Image
                    </Text>
                  )}
                </View>
                <View style={styles.tableColItem}>
                  <Text style={styles.tableCell}>{item.name}</Text>
                  {item.notes && (
                    <Text style={[styles.tableCell, { fontSize: 9, marginTop: 2 }]}>
                      {item.notes}
                    </Text>
                  )}
                </View>
                <View style={styles.tableColQty}>
                  <Text style={styles.tableCell}>{item.quantity}</Text>
                </View>
                <View style={styles.tableColPrice}>
                  <Text style={styles.tableCell}>
                    {formatCurrency(item.unitPrice)}
                  </Text>
                </View>
                <View style={styles.tableColPrice}>
                  <Text style={styles.tableCell}>
                    {formatCurrency(item.extended)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalsTable}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal:</Text>
              <Text style={styles.totalValue}>{formatCurrency(quote.subtotal)}</Text>
            </View>
            {quote.discount && quote.discount > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Discount:</Text>
                <Text style={styles.totalValue}>-{formatCurrency(quote.discount)}</Text>
              </View>
            )}
            {quote.shipping && quote.shipping > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Shipping:</Text>
                <Text style={styles.totalValue}>{formatCurrency(quote.shipping)}</Text>
              </View>
            )}
            {quote.tax && quote.tax > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Tax:</Text>
                <Text style={styles.totalValue}>{formatCurrency(quote.tax)}</Text>
              </View>
            )}
            <View style={styles.totalRowFinal}>
              <Text style={styles.totalLabelFinal}>Total:</Text>
              <Text style={styles.totalValueFinal}>{formatCurrency(quote.total)}</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          {quote.terms && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Terms & Conditions</Text>
              <Text style={styles.terms}>{quote.terms}</Text>
            </View>
          )}
          
          <Text style={styles.footerText}>
            Thank you for your business! • Generated on {new Date().toLocaleDateString()}
          </Text>
        </View>
      </Page>
    </Document>
  );
};

export default QuotePDF;
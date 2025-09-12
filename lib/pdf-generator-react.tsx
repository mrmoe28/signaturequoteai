import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';
import { Quote } from './types';

// Register fonts for better rendering
Font.register({
  family: 'Inter',
  src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff2',
});

Font.register({
  family: 'Inter-Bold',
  src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff2',
  fontWeight: 'bold',
});

// Define styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 30,
    fontFamily: 'Inter',
    fontSize: 10,
    lineHeight: 1.4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 30,
    borderBottom: '2 solid #E5E7EB',
    paddingBottom: 20,
  },
  companyInfo: {
    flexDirection: 'column',
    flex: 1,
  },
  companyName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  companyDetails: {
    fontSize: 10,
    color: '#6B7280',
    lineHeight: 1.3,
  },
  quoteInfo: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    flex: 1,
  },
  quoteTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  quoteNumber: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  quoteDate: {
    fontSize: 10,
    color: '#6B7280',
  },
  customerSection: {
    marginBottom: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  customerInfo: {
    flex: 1,
    marginRight: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
    borderBottom: '1 solid #E5E7EB',
    paddingBottom: 4,
  },
  customerName: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  customerDetails: {
    fontSize: 10,
    color: '#6B7280',
    lineHeight: 1.3,
  },
  itemsTable: {
    marginBottom: 30,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderBottom: '1 solid #E5E7EB',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1 solid #F3F4F6',
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  tableCell: {
    fontSize: 10,
    color: '#1F2937',
  },
  tableCellRight: {
    fontSize: 10,
    color: '#1F2937',
    textAlign: 'right',
  },
  tableCellCenter: {
    fontSize: 10,
    color: '#1F2937',
    textAlign: 'center',
  },
  colDescription: {
    flex: 3,
  },
  colQuantity: {
    flex: 1,
  },
  colUnitPrice: {
    flex: 1.5,
  },
  colExtended: {
    flex: 1.5,
  },
  totalsSection: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    marginTop: 20,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 200,
    paddingVertical: 4,
  },
  totalLabel: {
    fontSize: 10,
    color: '#6B7280',
  },
  totalValue: {
    fontSize: 10,
    color: '#1F2937',
    fontWeight: 'bold',
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 200,
    paddingVertical: 8,
    borderTop: '2 solid #1F2937',
    marginTop: 8,
  },
  grandTotalLabel: {
    fontSize: 12,
    color: '#1F2937',
    fontWeight: 'bold',
  },
  grandTotalValue: {
    fontSize: 12,
    color: '#1F2937',
    fontWeight: 'bold',
  },
  footer: {
    marginTop: 40,
    paddingTop: 20,
    borderTop: '1 solid #E5E7EB',
    fontSize: 9,
    color: '#6B7280',
    textAlign: 'center',
  },
  termsSection: {
    marginTop: 30,
    fontSize: 9,
    color: '#6B7280',
    lineHeight: 1.4,
  },
  termsTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
});

interface CompanySettings {
  name: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  logo?: string;
}

interface QuotePDFProps {
  quote: Quote;
  companySettings: CompanySettings | null;
}

const QuotePDFDocument: React.FC<QuotePDFProps> = ({ quote, companySettings }) => {
  const formatCurrency = (amount: number | null) => {
    if (amount === null) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (date: string | Date | undefined) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const subtotal = quote.items.reduce((sum, item) => sum + item.extended, 0);
  const taxRate = 0.08; // 8% tax rate - you might want to make this configurable
  const taxAmount = subtotal * taxRate;
  const total = subtotal + taxAmount;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.companyInfo}>
            <Text style={styles.companyName}>
              {companySettings?.name || 'Your Company Name'}
            </Text>
            <Text style={styles.companyDetails}>
              {companySettings?.address || '123 Business St, City, State 12345'}
            </Text>
            <Text style={styles.companyDetails}>
              Phone: {companySettings?.phone || '(555) 123-4567'}
            </Text>
            <Text style={styles.companyDetails}>
              Email: {companySettings?.email || 'info@company.com'}
            </Text>
            {companySettings?.website && (
              <Text style={styles.companyDetails}>
                Web: {companySettings.website}
              </Text>
            )}
          </View>
          <View style={styles.quoteInfo}>
            <Text style={styles.quoteTitle}>QUOTE</Text>
            <Text style={styles.quoteNumber}>Quote #{quote.id}</Text>
            <Text style={styles.quoteDate}>
              Date: {formatDate(quote.createdAt)}
            </Text>
          </View>
        </View>

        {/* Customer Information */}
        <View style={styles.customerSection}>
          <View style={styles.customerInfo}>
            <Text style={styles.sectionTitle}>Bill To:</Text>
            <Text style={styles.customerName}>{quote.customer.name}</Text>
            <Text style={styles.customerDetails}>
              {quote.customer.email}
            </Text>
            {quote.customer.phone && (
              <Text style={styles.customerDetails}>
                {quote.customer.phone}
              </Text>
            )}
            {quote.customer.shipTo && (
              <Text style={styles.customerDetails}>
                {quote.customer.shipTo}
              </Text>
            )}
          </View>
          <View style={styles.customerInfo}>
            <Text style={styles.sectionTitle}>Ship To:</Text>
            <Text style={styles.customerName}>{quote.customer.name}</Text>
            <Text style={styles.customerDetails}>
              {quote.customer.shipTo || 'Same as billing'}
            </Text>
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.itemsTable}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableCell, styles.colDescription]}>Description</Text>
            <Text style={[styles.tableCell, styles.colQuantity, styles.tableCellCenter]}>Qty</Text>
            <Text style={[styles.tableCell, styles.colUnitPrice, styles.tableCellRight]}>Unit Price</Text>
            <Text style={[styles.tableCell, styles.colExtended, styles.tableCellRight]}>Extended</Text>
          </View>
          {quote.items.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.colDescription]}>
                {item.name}
              </Text>
              <Text style={[styles.tableCell, styles.colQuantity, styles.tableCellCenter]}>
                {item.quantity}
              </Text>
              <Text style={[styles.tableCell, styles.colUnitPrice, styles.tableCellRight]}>
                {formatCurrency(item.unitPrice)}
              </Text>
              <Text style={[styles.tableCell, styles.colExtended, styles.tableCellRight]}>
                {formatCurrency(item.extended)}
              </Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal:</Text>
            <Text style={styles.totalValue}>{formatCurrency(subtotal)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tax (8%):</Text>
            <Text style={styles.totalValue}>{formatCurrency(taxAmount)}</Text>
          </View>
          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>Total:</Text>
            <Text style={styles.grandTotalValue}>{formatCurrency(total)}</Text>
          </View>
        </View>

        {/* Terms */}
        <View style={styles.termsSection}>
          <Text style={styles.termsTitle}>Terms & Conditions:</Text>
          <Text>
            • This quote is valid for 30 days from the date of issue.
          </Text>
          <Text>
            • Payment terms: Net 30 days from invoice date.
          </Text>
          <Text>
            • All prices are subject to change without notice.
          </Text>
          <Text>
            • Installation and delivery charges may apply.
          </Text>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          Thank you for your business! For questions about this quote, please contact us.
        </Text>
      </Page>
    </Document>
  );
};

export default QuotePDFDocument;

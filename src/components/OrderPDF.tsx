import React from 'react';
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink } from '@react-pdf/renderer';
import { FlightOrder, Vendor } from '../services/db';

const styles = StyleSheet.create({
  page: { padding: 30, fontSize: 11, fontFamily: 'Helvetica' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, borderBottom: '1 solid #ccc', paddingBottom: 10 },
  title: { fontSize: 18, fontWeight: 'bold' },
  subtitle: { fontSize: 12, color: '#666' },
  section: { marginBottom: 15 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 5, backgroundColor: '#f0f0f0', padding: 4 },
  row: { flexDirection: 'row', borderBottom: '1 solid #eee', paddingVertical: 4 },
  colName: { width: '50%' },
  colQty: { width: '15%', textAlign: 'center' },
  colNotes: { width: '35%' },
  bold: { fontWeight: 'bold' },
  footer: { position: 'absolute', bottom: 30, left: 30, right: 30, textAlign: 'center', color: '#999', fontSize: 9, borderTop: '1 solid #eee', paddingTop: 10 }
});

interface OrderPDFProps {
  order: FlightOrder;
  vendor?: Vendor;
}

const OrderDocument = ({ order, vendor }: OrderPDFProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>SKYBLUE GALLEY Order Sheet</Text>
          <Text style={styles.subtitle}>Flight: {order.flightNumber} | Tail: {order.tailNumber}</Text>
        </View>
        <View style={{ textAlign: 'right' }}>
          <Text>Date: {new Date(order.date).toLocaleDateString()}</Text>
          <Text>Status: {order.status}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Flight Details</Text>
        <Text>Route: {order.departure} → {order.arrival}</Text>
        <Text>Pax: {order.paxCount} | Crew: {order.crewCount}</Text>
        {order.dietaryNotes && <Text>Dietary Notes: {order.dietaryNotes}</Text>}
      </View>

      {vendor && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vendor Information</Text>
          <Text>To: {vendor.name}</Text>
          <Text>Contact: {vendor.contactPerson} ({vendor.phone})</Text>
          <Text>Address: {vendor.address}</Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Order Items</Text>
        <View style={[styles.row, styles.bold, { backgroundColor: '#fafafa' }]}>
          <Text style={styles.colName}>Item</Text>
          <Text style={styles.colQty}>Qty</Text>
          <Text style={styles.colNotes}>Notes</Text>
        </View>
        {order.items.map((item, i) => (
          <View key={i} style={styles.row}>
            <Text style={styles.colName}>{item.name}</Text>
            <Text style={styles.colQty}>{item.quantity}</Text>
            <Text style={styles.colNotes}>{item.notes || '-'}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Approvals</Text>
        <Text>Submitted By: {order.createdBy}</Text>
        {order.approvedBy && <Text>Approved By: {order.approvedBy}</Text>}
      </View>

      <Text style={styles.footer}>
        Order ID: {order.id} | Generated: {new Date().toLocaleString()}
      </Text>
    </Page>
  </Document>
);

export const DownloadPDFButton = ({ order, vendor }: OrderPDFProps) => (
  <PDFDownloadLink
    document={<OrderDocument order={order} vendor={vendor} />}
    fileName={`Order_${order.flightNumber}_${order.date.split('T')[0]}.pdf`}
    className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-blue-600 text-white hover:bg-blue-700 h-10 py-2 px-4"
  >
    {/* @ts-ignore */}
    {({ blob, url, loading, error }) =>
      loading ? 'Generating PDF...' : 'Download PDF'
    }
  </PDFDownloadLink>
);

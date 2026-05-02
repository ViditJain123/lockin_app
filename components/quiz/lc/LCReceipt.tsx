import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';

import { Fonts } from '../../../constants/Fonts';
import { LC } from '../../../constants/LockinClubColors';

interface LCReceiptProps {
  brand?: string;
  subtitle?: string;
  meta?: string;
  lineItems: Array<[string, string]>;
  total?: { label: string; value: string };
  footer?: string;
  rotate?: number;
  width?: number;
  showBarcode?: boolean;
  style?: ViewStyle;
}

export default function LCReceipt({
  brand = 'LOCKIN CLUB',
  subtitle,
  meta,
  lineItems,
  total,
  footer = 'KEEP GRINDING · NO REFUNDS',
  rotate = 0,
  width = 240,
  showBarcode = false,
  style,
}: LCReceiptProps) {
  return (
    <View
      style={[
        {
          width,
          transform: [{ rotate: `${rotate}deg` }],
        },
        style,
      ]}
    >
      <View style={styles.paper}>
        <View style={styles.headerBlock}>
          <Text style={styles.brand}>{brand}</Text>
          {subtitle ? <Text style={styles.sub}>— {subtitle.toUpperCase()} —</Text> : null}
          {meta ? <Text style={styles.meta}>{meta.toUpperCase()}</Text> : null}
        </View>

        {lineItems.map(([k, v]) => (
          <View key={k} style={styles.line}>
            <Text style={styles.lineKey}>{k.toUpperCase()}</Text>
            <Text style={styles.lineVal}>{v.toUpperCase()}</Text>
          </View>
        ))}

        {total ? (
          <View style={styles.totalBlock}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>{total.label.toUpperCase()}</Text>
              <Text style={styles.totalValue}>{total.value}</Text>
            </View>
          </View>
        ) : null}

        {showBarcode && (
          <View style={styles.barcodeRow}>
            {Array.from({ length: 38 }).map((_, i) => (
              <View
                key={i}
                style={{
                  width: 1 + (i % 4 === 0 ? 1 : 0),
                  height: 22 + (i % 3) * 3,
                  backgroundColor: LC.paperInk,
                  marginRight: 1,
                }}
              />
            ))}
          </View>
        )}

        <Text style={styles.footer}>{footer.toUpperCase()}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  paper: {
    backgroundColor: LC.paper,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  headerBlock: {
    alignItems: 'center',
    paddingBottom: 10,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: LC.paperInk,
    borderStyle: 'dashed',
  },
  brand: {
    fontFamily: Fonts.display,
    fontSize: 18,
    color: LC.paperInk,
    letterSpacing: 2.5,
  },
  sub: {
    fontFamily: Fonts.monoMedium,
    fontSize: 9,
    color: LC.paperInk,
    opacity: 0.7,
    letterSpacing: 1.5,
    marginTop: 2,
  },
  meta: {
    fontFamily: Fonts.monoRegular,
    fontSize: 9,
    color: LC.paperInk,
    opacity: 0.7,
    marginTop: 4,
    letterSpacing: 1,
  },
  line: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  lineKey: {
    fontFamily: Fonts.monoRegular,
    fontSize: 10,
    color: LC.paperInk,
    letterSpacing: 1,
  },
  lineVal: {
    fontFamily: Fonts.monoBold,
    fontSize: 10,
    color: LC.paperInk,
    letterSpacing: 1,
  },
  totalBlock: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: LC.paperInk,
    borderStyle: 'dashed',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  totalLabel: {
    fontFamily: Fonts.monoMedium,
    fontSize: 10,
    color: LC.paperInk,
    letterSpacing: 1,
  },
  totalValue: {
    fontFamily: Fonts.display,
    fontSize: 24,
    color: LC.redDeep,
  },
  barcodeRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    height: 28,
    marginTop: 10,
  },
  footer: {
    textAlign: 'center',
    fontFamily: Fonts.monoRegular,
    fontSize: 9,
    color: LC.paperInk,
    opacity: 0.65,
    marginTop: 8,
    letterSpacing: 1.2,
  },
});

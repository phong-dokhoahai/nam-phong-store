import {
  Document,
  Font,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";

Font.register({
  family: "BeVietnamPro",
  fonts: [
    { src: "/fonts/BeVietnamPro-Regular.ttf", fontWeight: 400 },
    { src: "/fonts/BeVietnamPro-Bold.ttf", fontWeight: 700 },
  ],
});
// Keep words intact; Vietnamese hyphenation is not meaningful.
Font.registerHyphenationCallback((word) => [word]);

export type PdfColumn = {
  header: string;
  /** Relative width weight of the column. */
  flex: number;
  align?: "left" | "right";
};

export type ReportPdfData = {
  title: string;
  companyName: string;
  /** Lines under the title, e.g. period and filters. */
  meta: string[];
  columns: PdfColumn[];
  rows: string[][];
  /** Optional totals row, same length as columns. */
  totals?: string[];
  generatedAtLabel: string;
  pageLabel: string;
  landscape?: boolean;
};

const colors = {
  text: "#101828",
  muted: "#667085",
  border: "#d0d5dd",
  headerBg: "#f2f4f7",
};

const styles = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingBottom: 48,
    paddingHorizontal: 36,
    fontFamily: "BeVietnamPro",
    fontSize: 9,
    color: colors.text,
  },
  company: { fontSize: 10, fontWeight: 700, textAlign: "center" },
  title: {
    marginTop: 8,
    fontSize: 15,
    fontWeight: 700,
    textAlign: "center",
    textTransform: "uppercase",
  },
  meta: { marginTop: 3, fontSize: 9, color: colors.muted, textAlign: "center" },
  table: {
    marginTop: 16,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderColor: colors.border,
  },
  row: { flexDirection: "row" },
  cell: {
    paddingVertical: 4,
    paddingHorizontal: 5,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  headerCell: { backgroundColor: colors.headerBg, fontWeight: 700 },
  totalsCell: { backgroundColor: colors.headerBg, fontWeight: 700 },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 36,
    right: 36,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 8,
    color: colors.muted,
  },
});

const cellStyle = (column: PdfColumn) => ({
  flex: column.flex,
  textAlign: column.align ?? "left",
});

export default function ReportPdfDocument({ data }: { data: ReportPdfData }) {
  return (
    <Document title={data.title}>
      <Page
        size="A4"
        orientation={data.landscape ? "landscape" : "portrait"}
        style={styles.page}
      >
        <Text style={styles.company}>{data.companyName}</Text>
        <Text style={styles.title}>{data.title}</Text>
        {data.meta.map((line) => (
          <Text key={line} style={styles.meta}>
            {line}
          </Text>
        ))}

        <View style={styles.table}>
          <View style={styles.row} fixed>
            {data.columns.map((column) => (
              <Text
                key={column.header}
                style={[styles.cell, styles.headerCell, cellStyle(column)]}
              >
                {column.header}
              </Text>
            ))}
          </View>
          {data.rows.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.row} wrap={false}>
              {row.map((value, columnIndex) => (
                <Text
                  key={columnIndex}
                  style={[styles.cell, cellStyle(data.columns[columnIndex])]}
                >
                  {value}
                </Text>
              ))}
            </View>
          ))}
          {data.totals && (
            <View style={styles.row} wrap={false}>
              {data.totals.map((value, columnIndex) => (
                <Text
                  key={columnIndex}
                  style={[
                    styles.cell,
                    styles.totalsCell,
                    cellStyle(data.columns[columnIndex]),
                  ]}
                >
                  {value}
                </Text>
              ))}
            </View>
          )}
        </View>

        <View style={styles.footer} fixed>
          <Text>{data.generatedAtLabel}</Text>
          <Text
            render={({ pageNumber, totalPages }) =>
              `${data.pageLabel} ${pageNumber}/${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}

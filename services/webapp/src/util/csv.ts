import { ColumnProps } from 'primereact/column';
import { parse } from 'json2csv';
import { saveAs } from 'file-saver';

export const exportCsv = async (columns: Array<ColumnProps & { title?: string }>, rows: any, fileName: string) => {
  const fields = columns.map(column => ({ label: column.header ?? column.title, value: column.field }));
  const csv = parse(rows, { fields: fields, delimiter: ';' });
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/plain;charset=utf-8' });
  const date = new Date().toISOString().split('T')[0];
  saveAs(blob, `${fileName} - ${date}.csv`, { autoBom: true });
};

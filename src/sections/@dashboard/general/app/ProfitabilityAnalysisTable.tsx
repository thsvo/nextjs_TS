import {
  Card,
  Table,
  TableRow,
  TableBody,
  TableCell,
  CardProps,
  CardHeader,
  TableContainer,
} from '@mui/material';
// utils
import { fCurrency } from '../../../../utils/formatNumber';
// components
import Scrollbar from '../../../../components/scrollbar';
import { TableHeadCustom } from '../../../../components/table';

// ----------------------------------------------------------------------

type RowProps = {
  id: string;
  name: string;
  gross_margin: number;
  ingredient_cost: number;
  orders_past_month: number;
};

interface Props extends CardProps {
  title?: string;
  subheader?: string;
  tableData: RowProps[];
  tableLabels: any;
}

export default function ProfitabilityAnalysisTable({
  title,
  subheader,
  tableData,
  tableLabels,
  ...other
}: Props) {
  return (
    <Card {...other}>
      <CardHeader title={title} subheader={subheader} sx={{ mb: 3 }} />

      <TableContainer sx={{ overflow: 'unset' }}>
        <Scrollbar>
          <Table sx={{ minWidth: 640 }}>
            <TableHeadCustom headLabel={tableLabels} />

            <TableBody>
              {tableData.map((row) => (
                <ProfitabilityAnalysisRow key={row.id} row={row} />
              ))}
            </TableBody>
          </Table>
        </Scrollbar>
      </TableContainer>
    </Card>
  );
}

// ----------------------------------------------------------------------

type ProfitabilityAnalysisRowProps = {
  row: RowProps;
};

function ProfitabilityAnalysisRow({ row }: ProfitabilityAnalysisRowProps) {
  return (
    <TableRow>
      <TableCell>{row.name}</TableCell>

      <TableCell>{fCurrency(row.ingredient_cost)}</TableCell>

      <TableCell sx={{ color: row.gross_margin < 0 ? 'error.main' : 'success.main', fontWeight: 'bold' }}>
        {`${(row.gross_margin * 100).toFixed(1)}%`}
      </TableCell>

      <TableCell align="center">{row.orders_past_month}</TableCell>
    </TableRow>
  );
}

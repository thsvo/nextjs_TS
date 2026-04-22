import {
  Card,
  Table,
  TableRow,
  TableBody,
  TableCell,
  CardProps,
  CardHeader,
  TableContainer,
  LinearProgress,
  Typography,
  Stack,
} from '@mui/material';
// components
import Scrollbar from '../../../../components/scrollbar';
import { TableHeadCustom } from '../../../../components/table';

// ----------------------------------------------------------------------

type RowProps = {
  id: string;
  category: string;
  ingredient: string;
  variant: string;
  subvariant: string;
  storage: string;
  form: string;
  balance: number | string;
  unit: string;
  percentage_of_full: number;
};

interface Props extends CardProps {
  title?: string;
  subheader?: string;
  tableData: RowProps[];
  tableLabels: any;
}

export default function InventoryLevelTable({
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
          <Table sx={{ minWidth: 800 }}>
            <TableHeadCustom headLabel={tableLabels} />

            <TableBody>
              {tableData.map((row) => (
                <InventoryLevelRow key={row.id} row={row} />
              ))}
            </TableBody>
          </Table>
        </Scrollbar>
      </TableContainer>
    </Card>
  );
}

// ----------------------------------------------------------------------

type InventoryLevelRowProps = {
  row: RowProps;
};

function InventoryLevelRow({ row }: InventoryLevelRowProps) {
  const isLow = row.percentage_of_full <= 0.3;
  const isMedium = row.percentage_of_full > 0.3 && row.percentage_of_full <= 0.7;

  return (
    <TableRow>
      <TableCell>{row.category}</TableCell>
      
      <TableCell sx={{ fontWeight: 'bold' }}>{row.ingredient}</TableCell>

      <TableCell>{row.variant}</TableCell>
      
      <TableCell>{row.storage}</TableCell>

      <TableCell>{`${row.balance} ${row.unit}`}</TableCell>

      <TableCell sx={{ minWidth: 160 }}>
        <Stack spacing={1}>
          <LinearProgress
            variant="determinate"
            value={row.percentage_of_full * 100}
            color={
              (isLow && 'error') || 
              (isMedium && 'warning') || 
              'success'
            }
            sx={{ height: 8, borderRadius: 1 }}
          />
          <Typography variant="caption" sx={{ color: 'text.secondary', textAlign: 'right' }}>
            {`${(row.percentage_of_full * 100).toFixed(0)}%`}
          </Typography>
        </Stack>
      </TableCell>
    </TableRow>
  );
}

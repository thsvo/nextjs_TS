import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import {
  Container,
  Card,
  CardHeader,
  CardContent,
  Table,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Alert,
  TablePagination,
} from '@mui/material';
import DashboardLayout from '../../../layouts/dashboard';
import { useSettingsContext } from '../../../components/settings';
import { TableHeadCustom } from '../../../components/table';
import Scrollbar from '../../../components/scrollbar';
import { getPortioningLevelsStock } from '../../../api/pantrix';

const HEAD = [
  { id: 'category', label: 'Category' },
  { id: 'ingredient', label: 'Ingredient' },
  { id: 'variant', label: 'Variant' },
  { id: 'size', label: 'Portion Size' },
  { id: 'current', label: 'Current Portions' },
  { id: 'unit', label: 'Unit' },
];

PortioningLevelsPage.getLayout = (page: React.ReactElement) => (
  <DashboardLayout>{page}</DashboardLayout>
);

export default function PortioningLevelsPage() {
  const { themeStretch } = useSettingsContext();
  const [rows, setRows] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const data = await getPortioningLevelsStock(page + 1, rowsPerPage);
      setRows(data.portions || []);
      setTotal(data.total_items || 0);
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.detail || 'Failed to load portion levels.' });
    }
  }, [page, rowsPerPage]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <>
      <Head>
        <title> Portioning: Levels | Pantrix</title>
      </Head>
      <Container maxWidth={themeStretch ? false : 'xl'}>
        <Card>
          <CardHeader
            title="Portioning Levels"
            subheader="Current stock of portioned ingredients"
          />
          <CardContent>
            {message && (
              <Alert severity={message.type} onClose={() => setMessage(null)} sx={{ mb: 2 }}>
                {message.text}
              </Alert>
            )}

            <TableContainer>
              <Scrollbar>
                <Table sx={{ minWidth: 900 }}>
                  <TableHeadCustom headLabel={HEAD} />
                  <TableBody>
                    {rows.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={HEAD.length} align="center">
                          No portions.
                        </TableCell>
                      </TableRow>
                    )}
                    {rows.map((r, i) => (
                      <TableRow key={r.Portion_UID || i}>
                        <TableCell>{r.category}</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>{r.ingredient}</TableCell>
                        <TableCell>
                          {[r.variant, r.subvariant, r.storage, r.form].filter(Boolean).join(' / ')}
                        </TableCell>
                        <TableCell>
                          {r.portion_size} {r.portion_unit}
                        </TableCell>
                        <TableCell>{r.current_portions ?? r.current_balance ?? 0}</TableCell>
                        <TableCell>{r.unit}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Scrollbar>
            </TableContainer>
            <TablePagination
              component="div"
              count={total}
              page={page}
              onPageChange={(_, p) => setPage(p)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
            />
          </CardContent>
        </Card>
      </Container>
    </>
  );
}

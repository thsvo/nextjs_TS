/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback, useMemo } from 'react';
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
  TableHead,
  TablePagination,
  TextField,
  Stack,
  Button,
  Alert,
  LinearProgress,
  Typography,
} from '@mui/material';
import DashboardLayout from '../../../layouts/dashboard';
import { useSettingsContext } from '../../../components/settings';
import Scrollbar from '../../../components/scrollbar';
import { getMonthlyUsage, MonthlyUsageRow } from '../../../api/pantrix';
import {
  FilterableHeader,
  applyColumnFilters,
} from '../../../components/pantrix/ColumnFilter';
import { exportRowsToExcel } from '../../../utils/exportExcel';

InventoryUsagePage.getLayout = (page: React.ReactElement) => (
  <DashboardLayout>{page}</DashboardLayout>
);

export default function InventoryUsagePage() {
  const { themeStretch } = useSettingsContext();
  const [rows, setRows] = useState<MonthlyUsageRow[]>([]);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [showAll, setShowAll] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<Record<string, string[] | null>>({});
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const setFilter = (field: string, value: string[] | null) =>
    setFilters((prev) => ({ ...prev, [field]: value }));

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMonthlyUsage(fromDate || undefined, toDate || undefined);
      setRows(data.usage || []);
      if (!fromDate) setFromDate(data.window_start || '');
      if (!toDate) setToDate(data.window_end || '');
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.detail || 'Failed to load usage data.' });
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate]);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    let list = rows;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (r) =>
          String(r.ingredient || '')
            .toLowerCase()
            .includes(q) ||
          String(r.category || '')
            .toLowerCase()
            .includes(q)
      );
    }
    return applyColumnFilters(list, filters);
  }, [rows, search, filters]);

  const paginated = useMemo(
    () => (showAll ? filtered : filtered.slice(page * rowsPerPage, (page + 1) * rowsPerPage)),
    [filtered, page, rowsPerPage, showAll]
  );

  const handleExport = () => {
    exportRowsToExcel(
      filtered.map((r) => ({
        Category: r.category,
        Ingredient: r.ingredient,
        Variant: r.variant,
        Subvariant: r.subvariant,
        Storage: r.storage,
        Form: r.form,
        Origin: r.origin_id,
        Unit: r.unit,
        'Total Usage': r.total_monthly_usage,
        'Usage Cost': r.total_usage_cost,
        'Total Wastage': r.total_monthly_wastage,
        'Wastage Cost': r.total_monthly_wastage_cost,
      })),
      `inventory_usage_${fromDate || 'all'}_${toDate || 'all'}.xlsx`,
      'Usage'
    );
  };

  return (
    <>
      <Head>
        <title> Inventory Usage | Pantrix</title>
      </Head>
      <Container maxWidth={themeStretch ? false : 'xl'}>
        <Card>
          <CardHeader title="Inventory Usage" subheader="Historical usage and wastage by ingredient" />
          <CardContent>
            {message && (
              <Alert severity={message.type} onClose={() => setMessage(null)} sx={{ mb: 2 }}>
                {message.text}
              </Alert>
            )}

            <Stack
              direction={{ xs: 'column', md: 'row' }}
              spacing={2}
              sx={{ mb: 2 }}
              alignItems={{ md: 'center' }}
              flexWrap="wrap"
            >
              <TextField
                size="small"
                type="date"
                label="From"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                size="small"
                type="date"
                label="To"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                size="small"
                label="Search ingredient"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
                sx={{ minWidth: 220 }}
              />
              <Button variant="contained" onClick={fetchData} disabled={loading}>
                Apply
              </Button>
              <Button
                variant="outlined"
                onClick={() => {
                  setSearch('');
                  setFilters({});
                  setFromDate('');
                  setToDate('');
                  fetchData();
                }}
              >
                Clear
              </Button>
              <Button
                variant="outlined"
                onClick={() => {
                  setShowAll((v) => !v);
                  setPage(0);
                }}
              >
                {showAll ? 'Paginate' : 'Show all'}
              </Button>
              <Button variant="contained" color="success" onClick={handleExport}>
                Export to Excel
              </Button>
            </Stack>

            {loading && <LinearProgress sx={{ mb: 1 }} />}

            <TableContainer>
              <Scrollbar>
                <Table sx={{ minWidth: 1200 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>
                        <FilterableHeader
                          label="Category"
                          rows={rows}
                          field="category"
                          filters={filters}
                          setFilter={setFilter}
                        />
                      </TableCell>
                      <TableCell>
                        <FilterableHeader
                          label="Ingredient"
                          rows={rows}
                          field="ingredient"
                          filters={filters}
                          setFilter={setFilter}
                        />
                      </TableCell>
                      <TableCell>
                        <FilterableHeader
                          label="Variant"
                          rows={rows}
                          field="variant"
                          filters={filters}
                          setFilter={setFilter}
                        />
                      </TableCell>
                      <TableCell>
                        <FilterableHeader
                          label="Subvariant"
                          rows={rows}
                          field="subvariant"
                          filters={filters}
                          setFilter={setFilter}
                        />
                      </TableCell>
                      <TableCell>
                        <FilterableHeader
                          label="Storage"
                          rows={rows}
                          field="storage"
                          filters={filters}
                          setFilter={setFilter}
                        />
                      </TableCell>
                      <TableCell>
                        <FilterableHeader
                          label="Form"
                          rows={rows}
                          field="form"
                          filters={filters}
                          setFilter={setFilter}
                        />
                      </TableCell>
                      <TableCell>
                        <FilterableHeader
                          label="Origin"
                          rows={rows}
                          field="origin_id"
                          filters={filters}
                          setFilter={setFilter}
                        />
                      </TableCell>
                      <TableCell>Unit</TableCell>
                      <TableCell align="right">Total Usage</TableCell>
                      <TableCell align="right">Usage Cost</TableCell>
                      <TableCell align="right">Total Wastage</TableCell>
                      <TableCell align="right">Wastage Cost</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginated.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={12} align="center">
                          <Typography color="text.secondary">
                            No usage data for the selected period.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                    {paginated.map((r, i) => (
                      <TableRow key={`${r.ingredient}-${i}`} hover>
                        <TableCell>{r.category}</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>{r.ingredient}</TableCell>
                        <TableCell>{r.variant}</TableCell>
                        <TableCell>{r.subvariant}</TableCell>
                        <TableCell>{r.storage}</TableCell>
                        <TableCell>{r.form}</TableCell>
                        <TableCell>{r.origin_id}</TableCell>
                        <TableCell>{r.unit}</TableCell>
                        <TableCell align="right">
                          {Number(r.total_monthly_usage || 0).toFixed(3)}
                        </TableCell>
                        <TableCell align="right">R {Number(r.total_usage_cost || 0).toFixed(2)}</TableCell>
                        <TableCell align="right">
                          {Number(r.total_monthly_wastage || 0).toFixed(3)}
                        </TableCell>
                        <TableCell align="right">
                          R {Number(r.total_monthly_wastage_cost || 0).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Scrollbar>
            </TableContainer>

            {!showAll && (
              <TablePagination
                component="div"
                count={filtered.length}
                page={page}
                onPageChange={(_, p) => setPage(p)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(e) => {
                  setRowsPerPage(parseInt(e.target.value, 10));
                  setPage(0);
                }}
                rowsPerPageOptions={[10, 25, 50, 100]}
              />
            )}
          </CardContent>
        </Card>
      </Container>
    </>
  );
}

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback, useMemo } from 'react';
import Head from 'next/head';
import {
  Container,
  Card,
  CardHeader,
  CardContent,
  Stack,
  Button,
  TextField,
  MenuItem,
  Table,
  TableBody,
  TableRow,
  TableCell,
  TableHead,
  TableContainer,
  TablePagination,
  Alert,
  LinearProgress,
  Typography,
  Chip,
  Autocomplete,
} from '@mui/material';
import DashboardLayout from '../../layouts/dashboard';
import { useSettingsContext } from '../../components/settings';
import Scrollbar from '../../components/scrollbar';
import { getProfitability, getMenuItems, ProfitabilityRow } from '../../api/pantrix';
import {
  FilterableHeader,
  applyColumnFilters,
} from '../../components/pantrix/ColumnFilter';
import { exportRowsToExcel } from '../../utils/exportExcel';

type MarginBucket = 'all' | 'none' | 'low' | 'medium' | 'high';

ProfitabilityPage.getLayout = (page: React.ReactElement) => (
  <DashboardLayout>{page}</DashboardLayout>
);

function matchBucket(pct: number, bucket: MarginBucket) {
  if (bucket === 'all') return true;
  if (bucket === 'none') return pct <= 0;
  if (bucket === 'low') return pct > 0 && pct <= 10;
  if (bucket === 'medium') return pct > 10 && pct <= 30;
  if (bucket === 'high') return pct > 30;
  return true;
}

function computeMarginPct(r: ProfitabilityRow): number {
  if (r.margin_percent !== undefined && r.margin_percent !== null) return Number(r.margin_percent);
  const price = Number(r.menu_price || 0);
  const cost = Number(r.cost || 0);
  if (!price) return 0;
  return ((price - cost) / price) * 100;
}

function marginColor(pct: number): 'error' | 'warning' | 'info' | 'success' {
  if (pct <= 0) return 'error';
  if (pct < 10) return 'warning';
  if (pct < 30) return 'info';
  return 'success';
}

export default function ProfitabilityPage() {
  const { themeStretch } = useSettingsContext();
  const [rows, setRows] = useState<ProfitabilityRow[]>([]);
  const [menuItems, setMenuItems] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [bucket, setBucket] = useState<MarginBucket>('all');
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
      const data = await getProfitability(10000);
      setRows(data);
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.detail || 'Failed to load profitability.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    getMenuItems()
      .then(setMenuItems)
      .catch(() => setMenuItems([]));
  }, [fetchData]);

  const filteredRows = useMemo(() => {
    let list = rows;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((r) =>
        String(r.menu_item || '')
          .toLowerCase()
          .includes(q)
      );
    }
    list = list.filter((r) => matchBucket(computeMarginPct(r), bucket));
    list = applyColumnFilters(list, filters);
    return list;
  }, [rows, search, bucket, filters]);

  const paginated = useMemo(
    () => (showAll ? filteredRows : filteredRows.slice(page * rowsPerPage, (page + 1) * rowsPerPage)),
    [filteredRows, page, rowsPerPage, showAll]
  );

  const handleExport = () => {
    exportRowsToExcel(
      filteredRows.map((r) => ({
        'Menu Category': r.menu_category,
        'Menu Item': r.menu_item,
        'Menu Price': r.menu_price,
        'Total Ingredient Cost': r.cost,
        'Gross Margin %': computeMarginPct(r).toFixed(1),
        'Orders (Past Month)': (r as any).orders_past_month,
      })),
      `profitability_${new Date().toISOString().slice(0, 10)}.xlsx`,
      'Profitability'
    );
  };

  return (
    <>
      <Head>
        <title> Profitability Analysis | Pantrix</title>
      </Head>
      <Container maxWidth={themeStretch ? false : 'xl'}>
        <Card>
          <CardHeader
            title="Profitability Analysis"
            subheader="Gross margin per menu item"
          />
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
              <Autocomplete
                freeSolo
                sx={{ minWidth: 260 }}
                options={menuItems}
                value={search}
                onChange={(_, v) => {
                  setSearch(v || '');
                  setPage(0);
                }}
                onInputChange={(_, v) => {
                  setSearch(v || '');
                  setPage(0);
                }}
                renderInput={(p) => <TextField {...p} size="small" label="Search menu item" />}
              />
              <TextField
                select
                size="small"
                label="Profit margin"
                value={bucket}
                onChange={(e) => {
                  setBucket(e.target.value as MarginBucket);
                  setPage(0);
                }}
                sx={{ minWidth: 200 }}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="none">No profit (≤ 0%)</MenuItem>
                <MenuItem value="low">Low (0–10%)</MenuItem>
                <MenuItem value="medium">Medium (10–30%)</MenuItem>
                <MenuItem value="high">High (&gt; 30%)</MenuItem>
              </TextField>
              <Button variant="outlined" onClick={() => fetchData()} disabled={loading}>
                Refresh
              </Button>
              <Button
                variant="outlined"
                color="warning"
                onClick={() => {
                  setFilters({});
                  setSearch('');
                  setBucket('all');
                }}
              >
                Clear all
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
                <Table sx={{ minWidth: 900 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>
                        <FilterableHeader
                          label="Menu Category"
                          rows={rows}
                          field="menu_category"
                          filters={filters}
                          setFilter={setFilter}
                        />
                      </TableCell>
                      <TableCell>
                        <FilterableHeader
                          label="Menu Item"
                          rows={rows}
                          field="menu_item"
                          filters={filters}
                          setFilter={setFilter}
                        />
                      </TableCell>
                      <TableCell align="right">Menu Price</TableCell>
                      <TableCell align="right">Ingredient Cost</TableCell>
                      <TableCell align="right">Gross Margin</TableCell>
                      <TableCell align="right">Orders (Past Month)</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginated.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          <Typography color="text.secondary">No menu items found.</Typography>
                        </TableCell>
                      </TableRow>
                    )}
                    {paginated.map((r, i) => {
                      const pct = computeMarginPct(r);
                      const color = marginColor(pct);
                      return (
                        <TableRow key={`${r.menu_item}-${i}`} hover>
                          <TableCell>{r.menu_category}</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>{r.menu_item}</TableCell>
                          <TableCell align="right">R {Number(r.menu_price || 0).toFixed(2)}</TableCell>
                          <TableCell align="right">R {Number(r.cost || 0).toFixed(2)}</TableCell>
                          <TableCell align="right">
                            <Chip
                              color={color as any}
                              size="small"
                              label={`${pct.toFixed(1)}%`}
                              sx={{ minWidth: 70 }}
                            />
                          </TableCell>
                          <TableCell align="right">
                            {(r as any).orders_past_month ?? (r as any).orders ?? 0}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Scrollbar>
            </TableContainer>

            {!showAll && (
              <TablePagination
                component="div"
                count={filteredRows.length}
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
            {showAll && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Showing all {filteredRows.length} items.
              </Typography>
            )}
          </CardContent>
        </Card>
      </Container>
    </>
  );
}

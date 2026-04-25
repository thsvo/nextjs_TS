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
  Button,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Stack,
  Alert,
  IconButton,
  LinearProgress,
  Typography,
} from '@mui/material';
import DashboardLayout from '../../../layouts/dashboard';
import { useSettingsContext } from '../../../components/settings';
import Scrollbar from '../../../components/scrollbar';
import Iconify from '../../../components/iconify';
import {
  getStockTakeIngredients,
  stockTakeSave,
  StockTakeIngredient,
  StockTakeType,
} from '../../../api/pantrix';
import {
  FilterableHeader,
  applyColumnFilters,
} from '../../../components/pantrix/ColumnFilter';

StockTakePage.getLayout = (page: React.ReactElement) => (
  <DashboardLayout>{page}</DashboardLayout>
);

function diffColor(diff: number): 'text.primary' | 'error.main' | 'success.main' {
  if (diff === 0) return 'text.primary';
  if (diff < 0) return 'error.main';
  return 'success.main';
}

export default function StockTakePage() {
  const { themeStretch } = useSettingsContext();
  const [type, setType] = useState<StockTakeType>('base');
  const [rows, setRows] = useState<StockTakeIngredient[]>([]);
  const [search, setSearch] = useState('');
  const [counts, setCounts] = useState<Record<string, string>>({});
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [showAll, setShowAll] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filters, setFilters] = useState<Record<string, string[] | null>>({});
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const setFilter = (field: string, value: string[] | null) =>
    setFilters((prev) => ({ ...prev, [field]: value }));

  const keyOf = (r: StockTakeIngredient) =>
    (r as any).portion_uid || (r as any).ing_uid || `${r.ingredient}-${r.variant}-${r.storage}-${r.form}`;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await getStockTakeIngredients(type));
      setCounts({});
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.detail || 'Failed to load stock take rows.' });
    } finally {
      setLoading(false);
    }
  }, [type]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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

  const handleSave = async () => {
    setSaving(true);
    try {
      const items = rows
        .filter((r) => counts[keyOf(r)] !== undefined)
        .map((r) => ({
          ingredient: r.ingredient,
          category: r.category,
          variant: r.variant,
          subvariant: r.subvariant,
          storage: r.storage,
          form: r.form,
          ing_uid: (r as any).ing_uid,
          portion_uid: (r as any).portion_uid,
          current_balance: r.current_balance,
          stock_taking_balance: parseFloat(counts[keyOf(r)] || String(r.current_balance || 0)),
        }));
      if (items.length === 0) {
        setMessage({ type: 'error', text: 'Enter at least one count before saving.' });
        return;
      }
      await stockTakeSave(items, new Date().toISOString().split('T')[0], type);
      setMessage({ type: 'success', text: `Saved ${items.length} counts.` });
      fetchData();
    } catch (err: any) {
      const errorText = typeof err?.detail === 'string' 
        ? err.detail 
        : JSON.stringify(err?.detail || err?.message || 'Save failed.');
      setMessage({ type: 'error', text: errorText });
    } finally {
      setSaving(false);
    }
  };

  const clearRow = (k: string) => {
    setCounts((prev) => {
      const rest = { ...prev };
      delete rest[k];
      return rest;
    });
  };

  return (
    <>
      <Head>
        <title> Stock Take | Pantrix</title>
      </Head>
      <Container maxWidth={themeStretch ? false : 'xl'}>
        <Card>
          <CardHeader
            title="Stock Take"
            subheader="Enter actual physical counts to reconcile balances"
            action={
              <ToggleButtonGroup
                exclusive
                size="small"
                value={type}
                onChange={(_, v) => v && setType(v)}
              >
                <ToggleButton value="base">Base ingredients</ToggleButton>
                <ToggleButton value="portioning">Portioned items</ToggleButton>
              </ToggleButtonGroup>
            }
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
              <TextField
                size="small"
                label="Search ingredient"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
                sx={{ minWidth: 240 }}
              />
              <Button variant="outlined" onClick={() => setSearch('')}>
                Clear search
              </Button>
              <Button
                variant="outlined"
                color="warning"
                onClick={() => setFilters({})}
                disabled={Object.values(filters).every((v) => v === null)}
              >
                Reset filters
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
              <Button variant="contained" onClick={handleSave} disabled={saving || loading}>
                Save all data
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
                      {type === 'portioning' && <TableCell>Portion Size</TableCell>}
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
                      <TableCell align="right">Current balance</TableCell>
                      <TableCell align="right">Count</TableCell>
                      <TableCell align="right">Difference</TableCell>
                      <TableCell>Unit</TableCell>
                      <TableCell />
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginated.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={type === 'portioning' ? 12 : 11} align="center">
                          <Typography color="text.secondary">No ingredients found.</Typography>
                        </TableCell>
                      </TableRow>
                    )}
                    {paginated.map((r) => {
                      const k = keyOf(r);
                      const draft = counts[k];
                      const current = Number(r.current_balance || 0);
                      const count = draft !== undefined ? parseFloat(draft) || 0 : null;
                      const diff = count === null ? null : count - current;
                      return (
                        <TableRow key={k} hover>
                          <TableCell>{r.category}</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>{r.ingredient}</TableCell>
                          <TableCell>{r.variant}</TableCell>
                          {type === 'portioning' && (
                            <TableCell>
                              {r.portion_size} {r.portion_unit}
                            </TableCell>
                          )}
                          <TableCell>{r.subvariant}</TableCell>
                          <TableCell>{r.storage}</TableCell>
                          <TableCell>{r.form}</TableCell>
                          <TableCell align="right">{current.toFixed(2)}</TableCell>
                          <TableCell align="right">
                            <TextField
                              size="small"
                              type="number"
                              value={draft ?? ''}
                              onChange={(e) => setCounts({ ...counts, [k]: e.target.value })}
                              placeholder={current.toFixed(2)}
                              sx={{ width: 110 }}
                            />
                          </TableCell>
                          <TableCell align="right">
                            {diff === null ? (
                              <Typography variant="caption" color="text.secondary">
                                —
                              </Typography>
                            ) : (
                              <Typography
                                variant="body2"
                                color={diffColor(diff)}
                                fontWeight="bold"
                              >
                                {diff > 0 ? '+' : ''}
                                {diff.toFixed(2)}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>{r.unit}</TableCell>
                          <TableCell>
                            <IconButton
                              size="small"
                              onClick={() => clearRow(k)}
                              disabled={draft === undefined}
                            >
                              <Iconify icon="eva:close-fill" width={16} />
                            </IconButton>
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

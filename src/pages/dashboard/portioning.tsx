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
  TableHead,
  TableContainer,
  TablePagination,
  Button,
  TextField,
  Stack,
  Typography,
  Alert,
  LinearProgress,
  IconButton,
  Divider,
  Box,
} from '@mui/material';
import DashboardLayout from '../../layouts/dashboard';
import { useSettingsContext } from '../../components/settings';
import Scrollbar from '../../components/scrollbar';
import Iconify from '../../components/iconify';
import {
  getPortioningSheet,
  getPortioningRows,
  portioningSave,
} from '../../api/pantrix';
import {
  FilterableHeader,
  applyColumnFilters,
} from '../../components/pantrix/ColumnFilter';
import { exportRowsToExcel } from '../../utils/exportExcel';

PortioningPage.getLayout = (page: React.ReactElement) => (
  <DashboardLayout>{page}</DashboardLayout>
);

type SourceRow = {
  category: string;
  ingredient: string;
  variant: string;
  subvariant: string;
  storage: string;
  form: string;
  unit: string;
  origin_id: string;
  Ing_UID: string;
  quantity: number;
};

type PortionRow = {
  ingredient: string;
  category: string;
  variant: string;
  subvariant: string;
  storage: string;
  form: string;
  portion_size: number | null;
  portion_unit: string;
  portion_number: number | null;
  total_quantity: number;
};

const blankRow = (src: SourceRow): PortionRow => ({
  ingredient: src.ingredient,
  category: src.category,
  variant: src.variant,
  subvariant: src.subvariant,
  storage: src.storage,
  form: src.form,
  portion_size: null,
  portion_unit: src.unit,
  portion_number: null,
  total_quantity: 0,
});

export default function PortioningPage() {
  const { themeStretch } = useSettingsContext();

  const [sheet, setSheet] = useState<SourceRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, string[] | null>>({});
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [source, setSource] = useState<SourceRow | null>(null);
  const [rows, setRows] = useState<PortionRow[]>([]);
  const [keepQty, setKeepQty] = useState<number>(0);

  const fetchSheet = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getPortioningSheet(500);
      setSheet(data as SourceRow[]);
    } catch (err: any) {
      setStatus({ type: 'error', text: err?.message || 'Failed to load portioning sheet' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSheet();
  }, [fetchSheet]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = sheet;
    if (q) {
      list = list.filter((r) =>
        [
          r.ingredient,
          r.category,
          r.variant,
          r.subvariant,
          r.storage,
          r.form,
          r.unit,
          r.origin_id,
        ]
          .map((v) => String(v || '').toLowerCase())
          .some((v) => v.includes(q))
      );
    }
    return applyColumnFilters(list, filters);
  }, [sheet, search, filters]);

  const setFilter = useCallback((field: string, value: string[] | null) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setPage(0);
  }, []);

  const showAll = rowsPerPage >= 99999;
  const paged = useMemo(() => {
    if (showAll) return filtered;
    const start = page * rowsPerPage;
    return filtered.slice(start, start + rowsPerPage);
  }, [filtered, page, rowsPerPage, showAll]);

  const handleOpen = async (src: SourceRow) => {
    setSource(src);
    setKeepQty(0);
    setStatus(null);
    setRows([blankRow(src)]);
    if (src.Ing_UID) {
      try {
        const hist = await getPortioningRows(src.Ing_UID);
        if (hist.length) {
          setRows(
            hist.map((r: any) => ({
              ingredient: r.ingredient,
              category: r.category,
              variant: r.variant,
              subvariant: r.subvariant,
              storage: r.storage,
              form: r.form,
              portion_size: Number(r.portion_size) || 0,
              portion_unit: r.portion_unit || src.unit,
              portion_number: null,
              total_quantity: 0,
            }))
          );
        }
      } catch {
        /* keep blank row */
      }
    }
    setTimeout(() => {
      document
        .getElementById('portioning-detail')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  const updateRow = (idx: number, patch: Partial<PortionRow>) => {
    setRows((prev) => {
      const next = prev.slice();
      const current = { ...next[idx], ...patch };
      const size = Number(current.portion_size) || 0;
      const num = Number(current.portion_number) || 0;
      current.total_quantity = size * num;
      next[idx] = current;
      return next;
    });
  };

  const addRow = () => {
    if (!source) return;
    setRows((prev) => [
      ...prev,
      {
        ...blankRow(source),
        variant: prev[prev.length - 1]?.variant || source.variant,
        subvariant: prev[prev.length - 1]?.subvariant || source.subvariant,
        storage: prev[prev.length - 1]?.storage || source.storage,
        form: prev[prev.length - 1]?.form || source.form,
      },
    ]);
  };

  const removeRow = (idx: number) => {
    setRows((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== idx)));
  };

  const wastage = useMemo(() => {
    if (!source) return 0;
    const total = Number(source.quantity) || 0;
    const sum = rows.reduce((s, r) => s + (Number(r.total_quantity) || 0), 0);
    return Math.max(total - sum - (Number(keepQty) || 0), 0);
  }, [rows, source, keepQty]);

  const handleSave = async () => {
    if (!source) return;
    const validRows = rows.filter((r) => (Number(r.total_quantity) || 0) > 0);
    if (!validRows.length) {
      setStatus({ type: 'error', text: 'Enter at least one row with a quantity.' });
      return;
    }
    setSaving(true);
    setStatus(null);
    try {
      const res = await portioningSave({
        source_ingredient: source.ingredient,
        source_category: source.category,
        source_variant: source.variant,
        source_subvariant: source.subvariant,
        source_form: source.storage,
        source_preparation: source.form,
        source_unit: source.unit,
        source_origin_id: source.origin_id,
        source_total_quantity: source.quantity || 0,
        keep_inventory_qty: keepQty || 0,
        rows: validRows.map((r) => ({
          ingredient: r.ingredient,
          category: r.category,
          variant: r.variant,
          subvariant: r.subvariant,
          storage: r.storage,
          form: r.form,
          portion_size: Number(r.portion_size) || null,
          portion_unit: r.portion_unit,
          portion_number: Number(r.portion_number) || null,
          total_quantity: Number(r.total_quantity) || 0,
        })),
      });
      setStatus({
        type: 'success',
        text: `Saved ${res.rows_saved ?? validRows.length} row(s). Wastage ${wastage.toFixed(2)} ${source.unit}.`,
      });
      setSource(null);
      setRows([]);
      setKeepQty(0);
      fetchSheet();
    } catch (err: any) {
      setStatus({
        type: 'error',
        text: err?.response?.data?.detail || 'Save failed',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleExport = () => {
    exportRowsToExcel(
      filtered.map((r) => ({
        Category: r.category,
        Ingredient: r.ingredient,
        Variant: r.variant,
        Subvariant: r.subvariant,
        Storage: r.storage,
        Form: r.form,
        Quantity: Number(r.quantity || 0).toFixed(2),
        Unit: r.unit,
        Origin: r.origin_id,
      })),
      'portioning-ingredients'
    );
  };

  return (
    <>
      <Head>
        <title> Ingredients: Portioning | Pantrix</title>
      </Head>

      <Container maxWidth={themeStretch ? false : 'xl'}>
        <Card>
          <CardHeader
            title="Portioning"
            subheader="Divide bulk ingredients into smaller portions and record wastage."
          />
          <CardContent>
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              spacing={2}
              sx={{ mb: 2 }}
              alignItems={{ md: 'center' }}
            >
              <TextField
                size="small"
                label="Search ingredients"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
                sx={{ minWidth: 280 }}
              />
              <Button
                onClick={() => {
                  setFilters({});
                  setSearch('');
                }}
                variant="outlined"
              >
                Clear filters
              </Button>
              <Button onClick={fetchSheet} variant="outlined">
                Refresh
              </Button>
              <Button onClick={handleExport} variant="outlined">
                Export to Excel
              </Button>
              <Button
                variant="outlined"
                onClick={() => setRowsPerPage(showAll ? 10 : 100000)}
              >
                {showAll ? 'Paginated' : 'Show all'}
              </Button>
            </Stack>

            {status && (
              <Alert severity={status.type} onClose={() => setStatus(null)} sx={{ mb: 2 }}>
                {status.text}
              </Alert>
            )}

            {loading && <LinearProgress sx={{ mb: 1 }} />}

            <TableContainer>
              <Scrollbar>
                <Table size="small" sx={{ minWidth: 960 }}>
                  <TableHead>
                    <TableRow>
                      <FilterableHeader
                        label="Category"
                        field="category"
                        rows={sheet}
                        filters={filters}
                        setFilter={setFilter}
                      />
                      <FilterableHeader
                        label="Ingredient"
                        field="ingredient"
                        rows={sheet}
                        filters={filters}
                        setFilter={setFilter}
                      />
                      <FilterableHeader
                        label="Variant"
                        field="variant"
                        rows={sheet}
                        filters={filters}
                        setFilter={setFilter}
                      />
                      <FilterableHeader
                        label="Subvariant"
                        field="subvariant"
                        rows={sheet}
                        filters={filters}
                        setFilter={setFilter}
                      />
                      <FilterableHeader
                        label="Storage"
                        field="storage"
                        rows={sheet}
                        filters={filters}
                        setFilter={setFilter}
                      />
                      <FilterableHeader
                        label="Form"
                        field="form"
                        rows={sheet}
                        filters={filters}
                        setFilter={setFilter}
                      />
                      <TableCell align="right">Quantity</TableCell>
                      <FilterableHeader
                        label="Unit"
                        field="unit"
                        rows={sheet}
                        filters={filters}
                        setFilter={setFilter}
                      />
                      <FilterableHeader
                        label="Origin"
                        field="origin_id"
                        rows={sheet}
                        filters={filters}
                        setFilter={setFilter}
                      />
                      <TableCell align="center">Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paged.map((row, i) => (
                      <TableRow
                        key={`${row.Ing_UID}-${i}`}
                        hover
                        selected={source?.Ing_UID === row.Ing_UID}
                      >
                        <TableCell>{row.category}</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>{row.ingredient}</TableCell>
                        <TableCell>{row.variant}</TableCell>
                        <TableCell>{row.subvariant}</TableCell>
                        <TableCell>{row.storage}</TableCell>
                        <TableCell>{row.form}</TableCell>
                        <TableCell align="right">
                          {Number(row.quantity || 0).toFixed(2)}
                        </TableCell>
                        <TableCell>{row.unit}</TableCell>
                        <TableCell>{row.origin_id}</TableCell>
                        <TableCell align="center">
                          <Button
                            size="small"
                            variant="contained"
                            onClick={() => handleOpen(row)}
                          >
                            Open
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!paged.length && !loading && (
                      <TableRow>
                        <TableCell colSpan={10} align="center" sx={{ color: 'text.secondary' }}>
                          No ingredients found.
                        </TableCell>
                      </TableRow>
                    )}
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

        {source && (
          <Card id="portioning-detail" sx={{ mt: 3 }}>
            <CardHeader
              title={`Portioning: ${source.ingredient}`}
              subheader={
                <Typography variant="body2">
                  Available:{' '}
                  <strong>
                    {Number(source.quantity || 0).toFixed(2)} {source.unit}
                  </strong>
                </Typography>
              }
              action={
                <IconButton onClick={() => setSource(null)}>
                  <Iconify icon="eva:close-outline" />
                </IconButton>
              }
            />
            <CardContent>
              <TableContainer sx={{ mb: 2 }}>
                <Scrollbar>
                  <Table size="small" sx={{ minWidth: 960 }}>
                    <TableHead>
                      <TableRow>
                        <TableCell>Ingredient</TableCell>
                        <TableCell>Category</TableCell>
                        <TableCell>Variant</TableCell>
                        <TableCell>Subvariant</TableCell>
                        <TableCell>Storage</TableCell>
                        <TableCell>Form</TableCell>
                        <TableCell align="right">Portion size</TableCell>
                        <TableCell>Unit</TableCell>
                        <TableCell align="right"># Portions</TableCell>
                        <TableCell align="right">Total</TableCell>
                        <TableCell align="center" />
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {rows.map((row, idx) => (
                        <TableRow key={idx}>
                          <TableCell>
                            <TextField
                              size="small"
                              value={row.ingredient}
                              onChange={(e) => updateRow(idx, { ingredient: e.target.value })}
                            />
                          </TableCell>
                          <TableCell>{row.category}</TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              value={row.variant}
                              onChange={(e) => updateRow(idx, { variant: e.target.value })}
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              value={row.subvariant}
                              onChange={(e) => updateRow(idx, { subvariant: e.target.value })}
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              value={row.storage}
                              onChange={(e) => updateRow(idx, { storage: e.target.value })}
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              value={row.form}
                              onChange={(e) => updateRow(idx, { form: e.target.value })}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <TextField
                              size="small"
                              type="number"
                              value={row.portion_size ?? ''}
                              onChange={(e) =>
                                updateRow(idx, {
                                  portion_size:
                                    e.target.value === ''
                                      ? null
                                      : parseFloat(e.target.value),
                                })
                              }
                              sx={{ width: 100 }}
                              inputProps={{ min: 0, step: 'any' }}
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              value={row.portion_unit}
                              onChange={(e) => updateRow(idx, { portion_unit: e.target.value })}
                              sx={{ width: 80 }}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <TextField
                              size="small"
                              type="number"
                              value={row.portion_number ?? ''}
                              onChange={(e) =>
                                updateRow(idx, {
                                  portion_number:
                                    e.target.value === ''
                                      ? null
                                      : parseFloat(e.target.value),
                                })
                              }
                              sx={{ width: 100 }}
                              inputProps={{ min: 0, step: 'any' }}
                            />
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                            {Number(row.total_quantity || 0).toFixed(2)}
                          </TableCell>
                          <TableCell align="center">
                            {rows.length > 1 && (
                              <IconButton size="small" onClick={() => removeRow(idx)}>
                                <Iconify icon="eva:trash-2-outline" />
                              </IconButton>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow sx={{ bgcolor: 'warning.lighter' }}>
                        <TableCell colSpan={9} sx={{ fontWeight: 600 }}>
                          Keep inventory
                        </TableCell>
                        <TableCell align="right">
                          <TextField
                            size="small"
                            type="number"
                            value={keepQty || ''}
                            onChange={(e) =>
                              setKeepQty(parseFloat(e.target.value) || 0)
                            }
                            sx={{ width: 100 }}
                            inputProps={{ min: 0, step: 'any' }}
                          />
                        </TableCell>
                        <TableCell />
                      </TableRow>
                      <TableRow sx={{ bgcolor: 'error.lighter' }}>
                        <TableCell colSpan={9} sx={{ fontWeight: 600, color: 'error.main' }}>
                          Wastage
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600, color: 'error.main' }}>
                          {wastage.toFixed(2)}
                        </TableCell>
                        <TableCell />
                      </TableRow>
                    </TableBody>
                  </Table>
                </Scrollbar>
              </TableContainer>

              <Divider sx={{ my: 2 }} />

              <Stack direction="row" spacing={2} justifyContent="flex-end">
                <Button variant="outlined" startIcon={<Iconify icon="eva:plus-outline" />} onClick={addRow}>
                  Add row
                </Button>
                <Button variant="outlined" onClick={() => setSource(null)}>
                  Cancel
                </Button>
                <Button variant="contained" onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving…' : 'Save portioning'}
                </Button>
              </Stack>

              {saving && <LinearProgress sx={{ mt: 2 }} />}
            </CardContent>
          </Card>
        )}

        <Box sx={{ mt: 3 }} />
      </Container>
    </>
  );
}

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
  ToggleButton,
  ToggleButtonGroup,
  Table,
  TableBody,
  TableRow,
  TableCell,
  TableHead,
  TableContainer,
  TablePagination,
  MenuItem,
  Alert,
  LinearProgress,
  Typography,
  Autocomplete,
} from '@mui/material';
import DashboardLayout from '../../../layouts/dashboard';
import { useSettingsContext } from '../../../components/settings';
import Scrollbar from '../../../components/scrollbar';
import { getLatestStock, getPortioningLevelsStock, getIngredients } from '../../../api/pantrix';
import {
  FilterableHeader,
  applyColumnFilters,
} from '../../../components/pantrix/ColumnFilter';
import { exportRowsToExcel } from '../../../utils/exportExcel';

type Mode = 'base' | 'portioned';
type LevelClass = 'all' | 'low' | 'medium' | 'high';

InventoryLevelsPage.getLayout = (page: React.ReactElement) => (
  <DashboardLayout>{page}</DashboardLayout>
);

const BASE_HEAD = [
  { id: 'category', label: 'Category' },
  { id: 'ingredient', label: 'Ingredient' },
  { id: 'variant', label: 'Variant' },
  { id: 'subvariant', label: 'Subvariant' },
  { id: 'storage', label: 'Storage' },
  { id: 'form', label: 'Form' },
  { id: 'balance', label: 'Balance' },
  { id: 'unit', label: 'Unit' },
  { id: 'pct', label: '% Full' },
];

const PORT_HEAD = [
  { id: 'category', label: 'Category' },
  { id: 'ingredient', label: 'Ingredient' },
  { id: 'variant', label: 'Variant' },
  { id: 'storage', label: 'Storage' },
  { id: 'form', label: 'Form' },
  { id: 'portion_size', label: 'Portion size' },
  { id: 'portion_unit', label: 'Unit' },
  { id: 'balance', label: 'Balance' },
  { id: 'pct', label: '% Full' },
];

function normalizePct(v: any): number {
  const n = parseFloat(v);
  if (Number.isNaN(n)) return 0;
  return n > 1 ? n : n * 100;
}

function levelColor(pct: number): 'error' | 'warning' | 'success' {
  if (pct < 30) return 'error';
  if (pct < 50) return 'warning';
  return 'success';
}

function classifyLevel(pct: number, cls: LevelClass) {
  if (cls === 'low') return pct < 30;
  if (cls === 'medium') return pct >= 30 && pct <= 50;
  if (cls === 'high') return pct > 50;
  return true;
}

function normalizeBaseRow(row: any): any {
  if (Array.isArray(row)) {
    return {
      category: row[0] ?? '',
      ingredient: row[1] ?? '',
      variant: row[2] ?? '',
      subvariant: row[3] ?? '',
      storage: row[4] ?? '',
      form: row[5] ?? '',
      balance: row[6] ?? 0,
      unit: row[7] ?? '',
      pct: row[8] ?? 0,
      stock_full_level: row[9] ?? 0,
    };
  }
  return {
    category: row.category ?? '',
    ingredient: row.ingredient ?? '',
    variant: row.variant ?? '',
    subvariant: row.subvariant ?? '',
    storage: row.storage ?? '',
    form: row.form ?? '',
    balance: row.current_balance ?? row.balance ?? 0,
    unit: row.unit ?? '',
    pct: row.percentage_of_full ?? row.pct ?? 0,
    stock_full_level: row.stock_full_level ?? 0,
  };
}

export default function InventoryLevelsPage() {
  const { themeStretch } = useSettingsContext();
  const [mode, setMode] = useState<Mode>('base');
  const [levelClass, setLevelClass] = useState<LevelClass>('all');
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [search, setSearch] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [filters, setFilters] = useState<Record<string, string[] | null>>({});
  const [ingredientOptions, setIngredientOptions] = useState<string[]>([]);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(
    null
  );

  const setFilter = (field: string, value: string[] | null) =>
    setFilters((prev) => ({ ...prev, [field]: value }));

  const clearFilters = () => setFilters({});

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (mode === 'base') {
        const size = showAll ? 10000 : rowsPerPage;
        const data = await getLatestStock(showAll ? 1 : page + 1, size);
        const arr = (data.ingredients || []).map(normalizeBaseRow);
        setRows(arr);
        setTotal(data.total_items ?? arr.length);
      } else {
        const size = showAll ? 10000 : rowsPerPage;
        const data = await getPortioningLevelsStock(showAll ? 1 : page + 1, size);
        setRows(data.portions || []);
        setTotal(data.total_items ?? (data.portions || []).length);
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.detail || 'Failed to load inventory.' });
    } finally {
      setLoading(false);
    }
  }, [mode, page, rowsPerPage, showAll]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    getIngredients()
      .then((ings) => setIngredientOptions(ings.map((i: any) => i.ingredient).filter(Boolean)))
      .catch(() => setIngredientOptions([]));
  }, []);

  const filteredRows = useMemo(() => {
    let list = rows;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((r) =>
        String(r.ingredient || '')
          .toLowerCase()
          .includes(q)
      );
    }
    list = applyColumnFilters(list, filters);
    list = list.filter((r) => classifyLevel(normalizePct(r.pct), levelClass));
    return list;
  }, [rows, search, filters, levelClass]);

  const handleExport = () => {
    exportRowsToExcel(
      filteredRows.map((r) => ({
        ...r,
        pct_full: normalizePct(r.pct).toFixed(1),
      })),
      `inventory_${mode}_${new Date().toISOString().slice(0, 10)}.xlsx`,
      'Inventory'
    );
  };

  const head = mode === 'base' ? BASE_HEAD : PORT_HEAD;

  return (
    <>
      <Head>
        <title> Inventory Levels | Pantrix</title>
      </Head>
      <Container maxWidth={themeStretch ? false : 'xl'}>
        <Card>
          <CardHeader
            title="Inventory Levels"
            subheader="Current stock balance and % of full capacity"
            action={
              <ToggleButtonGroup
                exclusive
                size="small"
                value={mode}
                onChange={(_, v) => {
                  if (v) {
                    setMode(v);
                    setPage(0);
                    setFilters({});
                  }
                }}
              >
                <ToggleButton value="base">Base ingredients</ToggleButton>
                <ToggleButton value="portioned">Portioned items</ToggleButton>
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
              alignItems={{ md: 'center' }}
              sx={{ mb: 2 }}
            >
              <Autocomplete
                freeSolo
                sx={{ minWidth: 260 }}
                options={ingredientOptions}
                value={search}
                onChange={(_, v) => setSearch(v || '')}
                onInputChange={(_, v) => setSearch(v || '')}
                renderInput={(p) => <TextField {...p} size="small" label="Search ingredient" />}
              />
              <TextField
                select
                size="small"
                sx={{ minWidth: 200 }}
                label="Level class"
                value={levelClass}
                onChange={(e) => setLevelClass(e.target.value as LevelClass)}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="low">Low (&lt; 30%)</MenuItem>
                <MenuItem value="medium">Medium (30–50%)</MenuItem>
                <MenuItem value="high">High (&gt; 50%)</MenuItem>
              </TextField>
              <Button variant="outlined" onClick={() => fetchData()} disabled={loading}>
                Refresh
              </Button>
              <Button variant="outlined" color="warning" onClick={clearFilters} disabled={loading}>
                Clear filters
              </Button>
              <Button
                variant="outlined"
                onClick={() => {
                  setShowAll(true);
                  setPage(0);
                }}
              >
                Show all
              </Button>
              <Button variant="contained" color="success" onClick={handleExport}>
                Export to Excel
              </Button>
            </Stack>

            {loading && <LinearProgress sx={{ mb: 1 }} />}

            <TableContainer>
              <Scrollbar>
                <Table sx={{ minWidth: 1100 }}>
                  <TableHead>
                    <TableRow>
                      {head.map((h) => (
                        <TableCell key={h.id}>
                          {['balance', 'pct', 'portion_size'].includes(h.id) ? (
                            <strong>{h.label}</strong>
                          ) : (
                            <FilterableHeader
                              label={h.label}
                              rows={rows}
                              field={h.id}
                              filters={filters}
                              setFilter={setFilter}
                            />
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredRows.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={head.length} align="center">
                          <Typography color="text.secondary">No ingredients found.</Typography>
                        </TableCell>
                      </TableRow>
                    )}
                    {filteredRows.map((r, i) => {
                      const pct = normalizePct(r.pct);
                      return (
                        <TableRow key={r.Ing_UID || r.Portion_UID || i} hover>
                          <TableCell>{r.category}</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>{r.ingredient}</TableCell>
                          <TableCell>{r.variant}</TableCell>
                          {mode === 'base' && <TableCell>{r.subvariant}</TableCell>}
                          <TableCell>{r.storage}</TableCell>
                          <TableCell>{r.form}</TableCell>
                          {mode === 'portioned' && (
                            <TableCell>
                              {r.portion_size} {r.portion_unit}
                            </TableCell>
                          )}
                          {mode === 'portioned' && <TableCell>{r.portion_unit}</TableCell>}
                          <TableCell align="right">
                            {Number(r.balance ?? r.current_portions ?? 0).toFixed(2)}
                          </TableCell>
                          {mode === 'base' && <TableCell>{r.unit}</TableCell>}
                          <TableCell align="right">
                            <Stack direction="row" spacing={1} alignItems="center" justifyContent="flex-end">
                              <Typography variant="body2">{pct.toFixed(1)}%</Typography>
                              <LinearProgress
                                variant="determinate"
                                value={Math.min(100, Math.max(0, pct))}
                                color={levelColor(pct)}
                                sx={{ width: 70, height: 6, borderRadius: 3 }}
                              />
                            </Stack>
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
                count={total}
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
              <Stack direction="row" justifyContent="flex-end" sx={{ mt: 1 }}>
                <Button
                  size="small"
                  onClick={() => {
                    setShowAll(false);
                    setPage(0);
                  }}
                >
                  Paginate
                </Button>
              </Stack>
            )}
          </CardContent>
        </Card>
      </Container>
    </>
  );
}

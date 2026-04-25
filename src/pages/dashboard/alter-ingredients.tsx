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
  Alert,
  Stack,
  LinearProgress,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import DashboardLayout from '../../layouts/dashboard';
import { useSettingsContext } from '../../components/settings';
import Scrollbar from '../../components/scrollbar';
import {
  getAlterIngredientData,
  saveAlterIngredientData,
  getAlterPortioningData,
  saveAlterPortioningData,
} from '../../api/pantrix';
import {
  FilterableHeader,
  applyColumnFilters,
} from '../../components/pantrix/ColumnFilter';

type Mode = 'base' | 'portioned';

AlterIngredientsPage.getLayout = (page: React.ReactElement) => (
  <DashboardLayout>{page}</DashboardLayout>
);

export default function AlterIngredientsPage() {
  const { themeStretch } = useSettingsContext();
  const [mode, setMode] = useState<Mode>('base');
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [showAll, setShowAll] = useState(false);
  const [filters, setFilters] = useState<Record<string, string[] | null>>({});

  const setFilter = (field: string, value: string[] | null) =>
    setFilters((prev) => ({ ...prev, [field]: value }));

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (mode === 'base') {
        setRows(await getAlterIngredientData(5000));
      } else {
        setRows(await getAlterPortioningData(5000));
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.detail || 'Failed to load ingredient data.' });
    } finally {
      setLoading(false);
    }
  }, [mode]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filtered = useMemo(() => applyColumnFilters(rows, filters), [rows, filters]);
  const paginated = useMemo(
    () => (showAll ? filtered : filtered.slice(page * rowsPerPage, (page + 1) * rowsPerPage)),
    [filtered, page, rowsPerPage, showAll]
  );

  const handleFieldChange = (realIdx: number, field: string, value: string) => {
    setRows((prev) => {
      const next = [...prev];
      next[realIdx] = { ...next[realIdx], [field]: value };
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (mode === 'base') {
        await saveAlterIngredientData(
          rows.map((ing) => ({
            ingredient: ing.ingredient,
            category: ing.category,
            variant: ing.variant,
            subvariant: ing.subvariant,
            storage: ing.storage,
            form: ing.form,
            unit: ing.unit,
            origin_id: ing.origin_id || 'bought',
            Ing_UID: ing.Ing_UID,
            stock_level_at_full: parseFloat(ing.stock_level_at_full) || 0,
            wastage_per_day: parseFloat(ing.wastage_per_day) || 0,
            additional_wastage: parseFloat(ing.additional_wastage) || 0,
          }))
        );
      } else {
        await saveAlterPortioningData(
          rows.map((ing) => ({
            Portion_UID: ing.Portion_UID,
            ingredient: ing.ingredient,
            category: ing.category,
            variant: ing.variant,
            storage: ing.storage,
            form: ing.form,
            unit: ing.unit,
            origin_id: ing.origin_id || 'bought',
            portion_size: parseFloat(ing.portion_size) || 0,
            portion_unit: ing.portion_unit,
            stock_level_at_full: parseFloat(ing.stock_level_at_full) || 0,
            wastage_per_day: parseFloat(ing.wastage_per_day) || 0,
            additional_wastage: parseFloat(ing.additional_wastage) || 0,
          }))
        );
      }
      setMessage({ type: 'success', text: 'All changes saved.' });
      fetchData();
    } catch (err: any) {
      const errorText = typeof err?.detail === 'string' 
        ? err.detail 
        : JSON.stringify(err?.detail || err?.error || 'Save failed.');
      setMessage({ type: 'error', text: errorText });
    } finally {
      setSaving(false);
    }
  };

  const baseHead = [
    { id: 'ingredient', label: 'Ingredient' },
    { id: 'category', label: 'Category' },
    { id: 'variant', label: 'Variant' },
    { id: 'subvariant', label: 'Subvariant' },
    { id: 'storage', label: 'Storage' },
    { id: 'form', label: 'Form' },
    { id: 'origin_id', label: 'Origin' },
    { id: 'unit', label: 'Unit' },
  ];
  const portHead = [
    { id: 'ingredient', label: 'Ingredient' },
    { id: 'category', label: 'Category' },
    { id: 'variant', label: 'Variant' },
    { id: 'storage', label: 'Storage' },
    { id: 'form', label: 'Form' },
    { id: 'origin_id', label: 'Origin' },
  ];
  const head = mode === 'base' ? baseHead : portHead;

  return (
    <>
      <Head>
        <title> Alter Ingredient Data | Pantrix</title>
      </Head>
      <Container maxWidth={themeStretch ? false : 'xl'}>
        <Card>
          <CardHeader
            title="Alter Ingredient Data"
            subheader="Master metadata, stock targets and wastage"
            action={
              <Stack direction="row" spacing={2} alignItems="center">
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
                  <ToggleButton value="base">Bulk items</ToggleButton>
                  <ToggleButton value="portioned">Portioned items</ToggleButton>
                </ToggleButtonGroup>
                <Button
                  variant="contained"
                  color="success"
                  onClick={handleSave}
                  disabled={saving || loading}
                >
                  Save all changes
                </Button>
              </Stack>
            }
          />
          <CardContent>
            {message && (
              <Alert severity={message.type} onClose={() => setMessage(null)} sx={{ mb: 2 }}>
                {message.text}
              </Alert>
            )}

            <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
              <Button variant="outlined" color="warning" onClick={() => setFilters({})}>
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
            </Stack>

            {loading && <LinearProgress sx={{ mb: 1 }} />}

            <TableContainer>
              <Scrollbar>
                <Table sx={{ minWidth: 1400 }}>
                  <TableHead>
                    <TableRow>
                      {head.map((h) => (
                        <TableCell key={h.id}>
                          <FilterableHeader
                            label={h.label}
                            rows={rows}
                            field={h.id}
                            filters={filters}
                            setFilter={setFilter}
                          />
                        </TableCell>
                      ))}
                      {mode === 'portioned' && <TableCell>Portion size</TableCell>}
                      {mode === 'portioned' && <TableCell>Portion unit</TableCell>}
                      <TableCell>Stock level at full</TableCell>
                      <TableCell>Wastage/day</TableCell>
                      <TableCell>Additional wastage</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginated.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={head.length + 3} align="center">
                          <Typography color="text.secondary">No rows.</Typography>
                        </TableCell>
                      </TableRow>
                    )}
                    {paginated.map((row, i) => {
                      const realIdx = rows.indexOf(row);
                      return (
                        <TableRow key={row.Ing_UID || row.Portion_UID || realIdx}>
                          <TableCell>
                            <TextField
                              size="small"
                              value={row.ingredient || ''}
                              sx={{ width: 150 }}
                              onChange={(e) =>
                                handleFieldChange(realIdx, 'ingredient', e.target.value)
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              value={row.category || ''}
                              sx={{ width: 120 }}
                              onChange={(e) =>
                                handleFieldChange(realIdx, 'category', e.target.value)
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              value={row.variant || ''}
                              sx={{ width: 120 }}
                              onChange={(e) =>
                                handleFieldChange(realIdx, 'variant', e.target.value)
                              }
                            />
                          </TableCell>
                          {mode === 'base' && (
                            <TableCell>
                              <TextField
                                size="small"
                                value={row.subvariant || ''}
                                sx={{ width: 100 }}
                                onChange={(e) =>
                                  handleFieldChange(realIdx, 'subvariant', e.target.value)
                                }
                              />
                            </TableCell>
                          )}
                          <TableCell>
                            <TextField
                              size="small"
                              value={row.storage || ''}
                              sx={{ width: 120 }}
                              onChange={(e) =>
                                handleFieldChange(realIdx, 'storage', e.target.value)
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              value={row.form || ''}
                              sx={{ width: 100 }}
                              onChange={(e) =>
                                handleFieldChange(realIdx, 'form', e.target.value)
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              value={row.origin_id || 'bought'}
                              sx={{ width: 100 }}
                              onChange={(e) =>
                                handleFieldChange(realIdx, 'origin_id', e.target.value)
                              }
                            />
                          </TableCell>
                          {mode === 'base' && (
                            <TableCell>
                              <TextField
                                size="small"
                                value={row.unit || ''}
                                sx={{ width: 80 }}
                                onChange={(e) =>
                                  handleFieldChange(realIdx, 'unit', e.target.value)
                                }
                              />
                            </TableCell>
                          )}
                          {mode === 'portioned' && (
                            <TableCell>
                              <TextField
                                size="small"
                                type="number"
                                value={row.portion_size ?? 0}
                                sx={{ width: 100 }}
                                onChange={(e) =>
                                  handleFieldChange(realIdx, 'portion_size', e.target.value)
                                }
                              />
                            </TableCell>
                          )}
                          {mode === 'portioned' && (
                            <TableCell>
                              <TextField
                                size="small"
                                value={row.portion_unit ?? ''}
                                sx={{ width: 90 }}
                                onChange={(e) =>
                                  handleFieldChange(realIdx, 'portion_unit', e.target.value)
                                }
                              />
                            </TableCell>
                          )}
                          <TableCell>
                            <TextField
                              size="small"
                              type="number"
                              value={row.stock_level_at_full ?? 0}
                              sx={{ width: 110 }}
                              onChange={(e) =>
                                handleFieldChange(realIdx, 'stock_level_at_full', e.target.value)
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              type="number"
                              value={row.wastage_per_day ?? 0}
                              sx={{ width: 110 }}
                              onChange={(e) =>
                                handleFieldChange(realIdx, 'wastage_per_day', e.target.value)
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              type="number"
                              value={row.additional_wastage ?? 0}
                              sx={{ width: 110 }}
                              onChange={(e) =>
                                handleFieldChange(realIdx, 'additional_wastage', e.target.value)
                              }
                            />
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

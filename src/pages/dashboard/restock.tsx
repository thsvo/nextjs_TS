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
  Stack,
  Alert,
  LinearProgress,
  MenuItem,
  Typography,
  Grid,
  Autocomplete,
  Divider,
} from '@mui/material';
import DashboardLayout from '../../layouts/dashboard';
import { useSettingsContext } from '../../components/settings';
import Scrollbar from '../../components/scrollbar';
import {
  getRestockSheetIngredients,
  getRestockManualAddOptions,
  restockManual,
  restockManualAddIngredient,
  RestockSheetRow,
  ManualAddOptions,
} from '../../api/pantrix';
import {
  FilterableHeader,
  applyColumnFilters,
} from '../../components/pantrix/ColumnFilter';

type Row = RestockSheetRow & { _qty: string; _cost: string; _date: string };

RestockPage.getLayout = (page: React.ReactElement) => <DashboardLayout>{page}</DashboardLayout>;

const todayYmd = () => new Date().toISOString().split('T')[0];

export default function RestockPage() {
  const { themeStretch } = useSettingsContext();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [filters, setFilters] = useState<Record<string, string[] | null>>({});
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [showAll, setShowAll] = useState(false);
  const [opts, setOpts] = useState<ManualAddOptions | null>(null);

  const [addForm, setAddForm] = useState({
    ingredient: '',
    category: '',
    variant: '',
    subvariant: '',
    storage: '',
    form: '',
    origin_id: 'bought',
    current_balance: '',
    quantity_added: '',
    unit: '',
    cost_of_ingredient: '',
    date: todayYmd(),
  });
  const [addStatus, setAddStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  const setFilter = (field: string, value: string[] | null) =>
    setFilters((prev) => ({ ...prev, [field]: value }));

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [data, options] = await Promise.all([
        getRestockSheetIngredients(),
        getRestockManualAddOptions().catch(() => null),
      ]);
      const today = todayYmd();
      setRows(data.map((r) => ({ ...r, _qty: '', _cost: '', _date: today })));
      setOpts(options);
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.detail || 'Failed to load restock sheet.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFieldChange = (index: number, field: '_qty' | '_cost' | '_date', value: string) => {
    setRows((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const filtered = useMemo(() => applyColumnFilters(rows, filters), [rows, filters]);
  const paginated = useMemo(
    () => (showAll ? filtered : filtered.slice(page * rowsPerPage, (page + 1) * rowsPerPage)),
    [filtered, page, rowsPerPage, showAll]
  );

  const handleSaveAll = async () => {
    const rowsToSave = rows.filter((r) => parseFloat(r._qty) > 0);
    if (rowsToSave.length === 0) {
      setMessage({ type: 'error', text: 'Enter at least one quantity before saving.' });
      return;
    }
    setSaving(true);
    try {
      const results = await Promise.allSettled(
        rowsToSave.map((row) =>
          restockManual({
            ingredient: row.ingredient,
            category: row.category,
            variant: row.variant,
            subvariant: row.subvariant,
            storage: row.storage,
            form: row.form,
            origin_id: row.origin_id,
            quantity: parseFloat(row._qty),
            total_cost: row._cost ? parseFloat(row._cost) : null,
            unit: row.unit,
            date: row._date,
          })
        )
      );
      const saved = results.filter((r) => r.status === 'fulfilled').length;
      const failed = results.length - saved;
      setMessage(
        failed === 0
          ? { type: 'success', text: `Saved ${saved} restock entries.` }
          : { type: 'error', text: `Saved ${saved}, ${failed} failed.` }
      );
      fetchData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.detail || 'Save failed.' });
    } finally {
      setSaving(false);
    }
  };

  const ingredientOptions = useMemo(
    () => (opts ? Array.from(new Set(opts.category_ingredient.map((c) => c.ingredient))) : []),
    [opts]
  );

  const handleAddIngredient = async () => {
    if (!addForm.ingredient.trim() || !parseFloat(addForm.quantity_added)) {
      setAddStatus({ type: 'error', text: 'Ingredient and quantity are required.' });
      return;
    }
    try {
      await restockManualAddIngredient({
        ingredient: addForm.ingredient.trim(),
        category: addForm.category.trim(),
        variant: addForm.variant.trim(),
        subvariant: addForm.subvariant.trim(),
        storage: addForm.storage.trim(),
        form: addForm.form.trim(),
        origin_id: addForm.origin_id,
        unit: addForm.unit.trim(),
        current_balance: parseFloat(addForm.current_balance) || 0,
        date: addForm.date,
        quantity_added: parseFloat(addForm.quantity_added),
        cost_of_ingredient: addForm.cost_of_ingredient
          ? parseFloat(addForm.cost_of_ingredient)
          : null,
      });
      setAddStatus({ type: 'success', text: `Added ${addForm.ingredient}.` });
      setAddForm({
        ingredient: '',
        category: '',
        variant: '',
        subvariant: '',
        storage: '',
        form: '',
        origin_id: 'bought',
        current_balance: '',
        quantity_added: '',
        unit: '',
        cost_of_ingredient: '',
        date: todayYmd(),
      });
      fetchData();
    } catch (err: any) {
      setAddStatus({ type: 'error', text: err?.detail || 'Add failed.' });
    }
  };

  return (
    <>
      <Head>
        <title> Restock | Pantrix</title>
      </Head>
      <Container maxWidth={themeStretch ? false : 'xl'}>
        <Card sx={{ mb: 3 }}>
          <CardHeader
            title="Restock"
            subheader="Enter quantities and costs for restocked ingredients"
            action={
              <Stack direction="row" spacing={1}>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setShowAll((v) => !v);
                    setPage(0);
                  }}
                >
                  {showAll ? 'Paginate' : 'Show all'}
                </Button>
                <Button variant="outlined" color="warning" onClick={() => setFilters({})}>
                  Reset filters
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSaveAll}
                  disabled={saving || loading}
                >
                  Save all data
                </Button>
              </Stack>
            }
          />
          <CardContent>
            {loading && <LinearProgress sx={{ mb: 1 }} />}
            {message && (
              <Alert severity={message.type} onClose={() => setMessage(null)} sx={{ mb: 2 }}>
                {message.text}
              </Alert>
            )}

            <TableContainer>
              <Scrollbar>
                <Table sx={{ minWidth: 1400 }}>
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
                      <TableCell align="right">Current balance</TableCell>
                      <TableCell>Quantity</TableCell>
                      <TableCell>Unit</TableCell>
                      <TableCell>Total cost</TableCell>
                      <TableCell>Date</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginated.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={12} align="center">
                          <Typography color="text.secondary">No ingredients loaded.</Typography>
                        </TableCell>
                      </TableRow>
                    )}
                    {paginated.map((row, i) => {
                      const realIndex = rows.indexOf(row);
                      return (
                        <TableRow
                          key={`${row.ingredient}-${row.variant}-${row.storage}-${realIndex}-${i}`}
                          hover
                        >
                          <TableCell>{row.category}</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>{row.ingredient}</TableCell>
                          <TableCell>{row.variant}</TableCell>
                          <TableCell>{row.subvariant}</TableCell>
                          <TableCell>{row.storage}</TableCell>
                          <TableCell>{row.form}</TableCell>
                          <TableCell>{row.origin_id}</TableCell>
                          <TableCell align="right">
                            {Number(row.current_balance || 0).toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              type="number"
                              value={row._qty}
                              onChange={(e) => handleFieldChange(realIndex, '_qty', e.target.value)}
                              sx={{ width: 110 }}
                            />
                          </TableCell>
                          <TableCell>{row.unit}</TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              type="number"
                              value={row._cost}
                              onChange={(e) => handleFieldChange(realIndex, '_cost', e.target.value)}
                              sx={{ width: 120 }}
                              placeholder="R"
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              type="date"
                              value={row._date}
                              onChange={(e) => handleFieldChange(realIndex, '_date', e.target.value)}
                              sx={{ width: 160 }}
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

        <Card>
          <CardHeader title="Add ingredient not in table" />
          <CardContent>
            {addStatus && (
              <Alert
                severity={addStatus.type}
                onClose={() => setAddStatus(null)}
                sx={{ mb: 2 }}
              >
                {addStatus.text}
              </Alert>
            )}
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <Autocomplete
                  freeSolo
                  size="small"
                  options={ingredientOptions}
                  value={addForm.ingredient}
                  onChange={(_, v) => setAddForm({ ...addForm, ingredient: v || '' })}
                  onInputChange={(_, v) => setAddForm({ ...addForm, ingredient: v || '' })}
                  renderInput={(p) => <TextField {...p} label="Ingredient *" />}
                />
              </Grid>
              <Grid item xs={6} md={2}>
                <TextField
                  size="small"
                  fullWidth
                  label="Category"
                  value={addForm.category}
                  onChange={(e) => setAddForm({ ...addForm, category: e.target.value })}
                />
              </Grid>
              <Grid item xs={6} md={2}>
                <TextField
                  size="small"
                  fullWidth
                  label="Variant"
                  value={addForm.variant}
                  onChange={(e) => setAddForm({ ...addForm, variant: e.target.value })}
                />
              </Grid>
              <Grid item xs={6} md={2}>
                <TextField
                  size="small"
                  fullWidth
                  label="Subvariant"
                  value={addForm.subvariant}
                  onChange={(e) => setAddForm({ ...addForm, subvariant: e.target.value })}
                />
              </Grid>
              <Grid item xs={6} md={2}>
                <TextField
                  size="small"
                  fullWidth
                  label="Storage"
                  value={addForm.storage}
                  onChange={(e) => setAddForm({ ...addForm, storage: e.target.value })}
                />
              </Grid>
              <Grid item xs={6} md={2}>
                <TextField
                  size="small"
                  fullWidth
                  label="Form"
                  value={addForm.form}
                  onChange={(e) => setAddForm({ ...addForm, form: e.target.value })}
                />
              </Grid>
              <Grid item xs={6} md={2}>
                <TextField
                  size="small"
                  fullWidth
                  select
                  label="Origin ID"
                  value={addForm.origin_id}
                  onChange={(e) => setAddForm({ ...addForm, origin_id: e.target.value })}
                >
                  <MenuItem value="bought">Bought</MenuItem>
                  <MenuItem value="made">Made</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={6} md={2}>
                <TextField
                  size="small"
                  fullWidth
                  label="Unit"
                  value={addForm.unit}
                  onChange={(e) => setAddForm({ ...addForm, unit: e.target.value })}
                />
              </Grid>
              <Grid item xs={6} md={2}>
                <TextField
                  size="small"
                  fullWidth
                  type="number"
                  label="Current balance"
                  value={addForm.current_balance}
                  onChange={(e) => setAddForm({ ...addForm, current_balance: e.target.value })}
                />
              </Grid>
              <Grid item xs={6} md={2}>
                <TextField
                  size="small"
                  fullWidth
                  type="number"
                  label="Quantity *"
                  value={addForm.quantity_added}
                  onChange={(e) => setAddForm({ ...addForm, quantity_added: e.target.value })}
                />
              </Grid>
              <Grid item xs={6} md={2}>
                <TextField
                  size="small"
                  fullWidth
                  type="number"
                  label="Cost (R)"
                  value={addForm.cost_of_ingredient}
                  onChange={(e) =>
                    setAddForm({ ...addForm, cost_of_ingredient: e.target.value })
                  }
                />
              </Grid>
              <Grid item xs={6} md={2}>
                <TextField
                  size="small"
                  fullWidth
                  type="date"
                  label="Date"
                  InputLabelProps={{ shrink: true }}
                  value={addForm.date}
                  onChange={(e) => setAddForm({ ...addForm, date: e.target.value })}
                />
              </Grid>
            </Grid>
            <Divider sx={{ my: 2 }} />
            <Button variant="contained" color="primary" onClick={handleAddIngredient}>
              Save ingredient
            </Button>
          </CardContent>
        </Card>
      </Container>
    </>
  );
}

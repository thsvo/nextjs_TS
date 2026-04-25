import { useState, useEffect, useCallback, useMemo } from 'react';
import Head from 'next/head';
import {
  Container,
  Grid,
  Card,
  CardHeader,
  CardContent,
  Stack,
  TextField,
  Button,
  Alert,
  MenuItem,
  Autocomplete,
  Typography,
  Divider,
} from '@mui/material';
import DashboardLayout from '../../../layouts/dashboard';
import { useSettingsContext } from '../../../components/settings';
import {
  getRestockManualAddOptions,
  restockManualAddIngredient,
  restockManual,
  ManualAddOptions,
} from '../../../api/pantrix';

ManualAddPage.getLayout = (page: React.ReactElement) => <DashboardLayout>{page}</DashboardLayout>;

export default function ManualAddPage() {
  const { themeStretch } = useSettingsContext();
  const [opts, setOpts] = useState<ManualAddOptions | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [form, setForm] = useState({
    mode: 'existing' as 'existing' | 'new',
    ingredient: '',
    category: '',
    variant: '',
    subvariant: 'Regular',
    storage: '',
    form: '',
    origin_id: 'bought',
    unit: '',
    quantity: 0,
    current_balance: 0,
    total_cost: '',
    date: new Date().toISOString().split('T')[0],
  });

  const fetchOptions = useCallback(async () => {
    try {
      setOpts(await getRestockManualAddOptions());
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.detail || 'Failed to load options.' });
    }
  }, []);

  useEffect(() => {
    fetchOptions();
  }, [fetchOptions]);

  const ingredientList = useMemo(
    () => opts?.ingredients.map((i) => i.ingredient) || [],
    [opts]
  );

  const variantsForCategory = useMemo(() => {
    if (!opts || !form.category) return [];
    return Array.from(
      new Set(
        opts.category_variant.filter((v) => v.category === form.category).map((v) => v.variant)
      )
    );
  }, [opts, form.category]);

  const storagesForCategory = useMemo(() => {
    if (!opts || !form.category) return [];
    return Array.from(
      new Set(opts.category_form.filter((v) => v.category === form.category).map((v) => v.storage))
    );
  }, [opts, form.category]);

  const formsForCategory = useMemo(() => {
    if (!opts || !form.category) return [];
    return Array.from(
      new Set(
        opts.category_preparation.filter((v) => v.category === form.category).map((v) => v.form)
      )
    );
  }, [opts, form.category]);

  const handleExistingPick = (val: string) => {
    const found = opts?.ingredients.find((i) => i.ingredient === val);
    if (found) {
      setForm((prev) => ({
        ...prev,
        ingredient: found.ingredient,
        category: found.category,
        unit: found.unit,
        subvariant: found.subvariant || 'Regular',
        form: found.form || '',
      }));
    } else {
      setForm((prev) => ({ ...prev, ingredient: val }));
    }
  };

  const submit = async () => {
    if (!form.ingredient || form.quantity <= 0) {
      setMessage({ type: 'error', text: 'Ingredient and quantity are required.' });
      return;
    }
    try {
      if (form.mode === 'new') {
        if (!form.variant || !form.storage || !form.unit) {
          setMessage({ type: 'error', text: 'Variant, storage, and unit are required.' });
          return;
        }
        await restockManualAddIngredient({
          ingredient: form.ingredient,
          category: form.category,
          variant: form.variant,
          subvariant: form.subvariant,
          storage: form.storage,
          form: form.form,
          origin_id: form.origin_id,
          unit: form.unit,
          current_balance: form.current_balance,
          quantity_added: form.quantity,
          cost_of_ingredient: form.total_cost ? parseFloat(form.total_cost) : null,
          date: form.date,
        });
        setMessage({ type: 'success', text: 'New ingredient added with restock.' });
      } else {
        await restockManual({
          ingredient: form.ingredient,
          category: form.category,
          variant: form.variant,
          subvariant: form.subvariant,
          storage: form.storage,
          form: form.form,
          origin_id: form.origin_id,
          unit: form.unit,
          quantity: form.quantity,
          total_cost: form.total_cost ? parseFloat(form.total_cost) : null,
          date: form.date,
        });
        setMessage({ type: 'success', text: 'Restock recorded.' });
      }
      setForm((prev) => ({ ...prev, quantity: 0, total_cost: '' }));
    } catch (err: any) {
      const errorText = typeof err?.detail === 'string' 
        ? err.detail 
        : JSON.stringify(err?.detail || err?.error || 'Save failed.');
      setMessage({ type: 'error', text: errorText });
    }
  };

  return (
    <>
      <Head>
        <title> Restock: Manual Add | Pantrix</title>
      </Head>
      <Container maxWidth={themeStretch ? false : 'md'}>
        <Card>
          <CardHeader
            title="Manual Restock"
            subheader="Add a restock for an existing or brand-new ingredient"
          />
          <CardContent>
            {message && (
              <Alert severity={message.type} onClose={() => setMessage(null)} sx={{ mb: 2 }}>
                {message.text}
              </Alert>
            )}

            <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
              <Button
                variant={form.mode === 'existing' ? 'contained' : 'outlined'}
                onClick={() => setForm({ ...form, mode: 'existing' })}
              >
                Existing ingredient
              </Button>
              <Button
                variant={form.mode === 'new' ? 'contained' : 'outlined'}
                onClick={() => setForm({ ...form, mode: 'new' })}
              >
                New ingredient
              </Button>
            </Stack>

            <Divider sx={{ mb: 2 }} />

            <Grid container spacing={2}>
              <Grid item xs={12} sm={8}>
                <Autocomplete
                  freeSolo
                  options={ingredientList}
                  value={form.ingredient}
                  onChange={(_, v) => handleExistingPick((v as string) || '')}
                  onInputChange={(_, v) => setForm({ ...form, ingredient: v })}
                  renderInput={(p) => <TextField {...p} label="Ingredient" />}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  select
                  fullWidth
                  label="Category"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  {(opts?.category_ingredient || [])
                    .map((c) => c.category)
                    .filter((v, i, a) => a.indexOf(v) === i)
                    .map((c) => (
                      <MenuItem key={c} value={c}>
                        {c}
                      </MenuItem>
                    ))}
                </TextField>
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  select
                  fullWidth
                  label="Variant"
                  value={form.variant}
                  onChange={(e) => setForm({ ...form, variant: e.target.value })}
                >
                  {variantsForCategory.map((v) => (
                    <MenuItem key={v} value={v}>
                      {v}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  select
                  fullWidth
                  label="Storage"
                  value={form.storage}
                  onChange={(e) => setForm({ ...form, storage: e.target.value })}
                >
                  {storagesForCategory.map((v) => (
                    <MenuItem key={v} value={v}>
                      {v}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  select
                  fullWidth
                  label="Form"
                  value={form.form}
                  onChange={(e) => setForm({ ...form, form: e.target.value })}
                >
                  {formsForCategory.map((v) => (
                    <MenuItem key={v} value={v}>
                      {v}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  label="Subvariant"
                  value={form.subvariant}
                  onChange={(e) => setForm({ ...form, subvariant: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  select
                  fullWidth
                  label="Origin"
                  value={form.origin_id}
                  onChange={(e) => setForm({ ...form, origin_id: e.target.value })}
                >
                  <MenuItem value="bought">Bought</MenuItem>
                  <MenuItem value="made">Made</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  label="Unit"
                  value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value })}
                  placeholder="kg / each / l"
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  type="date"
                  label="Date"
                  InputLabelProps={{ shrink: true }}
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                />
              </Grid>

              {form.mode === 'new' && (
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Current balance"
                    value={form.current_balance}
                    onChange={(e) =>
                      setForm({ ...form, current_balance: parseFloat(e.target.value) || 0 })
                    }
                  />
                </Grid>
              )}

              <Grid item xs={12} sm={form.mode === 'new' ? 4 : 6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Quantity added"
                  value={form.quantity}
                  onChange={(e) =>
                    setForm({ ...form, quantity: parseFloat(e.target.value) || 0 })
                  }
                />
              </Grid>

              <Grid item xs={12} sm={form.mode === 'new' ? 4 : 6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Total cost (optional)"
                  value={form.total_cost}
                  onChange={(e) => setForm({ ...form, total_cost: e.target.value })}
                />
              </Grid>

              <Grid item xs={12}>
                <Stack direction="row" justifyContent="flex-end" spacing={1}>
                  <Button variant="contained" onClick={submit}>
                    {form.mode === 'new' ? 'Add & Restock' : 'Record Restock'}
                  </Button>
                </Stack>
              </Grid>
            </Grid>

            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Switch to &quot;New ingredient&quot; to create a brand-new item with its first
              restock.
            </Typography>
          </CardContent>
        </Card>
      </Container>
    </>
  );
}

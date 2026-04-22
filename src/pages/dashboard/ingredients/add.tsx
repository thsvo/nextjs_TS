import { useState, useEffect } from 'react';
import Head from 'next/head';
import {
  Container,
  Card,
  CardHeader,
  CardContent,
  Grid,
  TextField,
  Button,
  Alert,
  Autocomplete,
  Stack,
} from '@mui/material';
import DashboardLayout from '../../../layouts/dashboard';
import { useSettingsContext } from '../../../components/settings';
import {
  addIngredient,
  getRestockManualAddOptions,
  ManualAddOptions,
} from '../../../api/pantrix';

IngredientsAddPage.getLayout = (page: React.ReactElement) => (
  <DashboardLayout>{page}</DashboardLayout>
);

export default function IngredientsAddPage() {
  const { themeStretch } = useSettingsContext();
  const [options, setOptions] = useState<ManualAddOptions | null>(null);
  const [form, setForm] = useState({
    ingredient: '',
    category: '',
    variant: '',
    subvariant: '',
    storage: '',
    form: '',
    origin_id: 'bought',
    unit: '',
    quantity: '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    getRestockManualAddOptions()
      .then(setOptions)
      .catch((e) =>
        setMessage({ type: 'error', text: e?.detail || 'Failed to load options.' })
      );
  }, []);

  const update = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const categories = Array.from(
    new Set((options?.category_ingredient || []).map((c) => c.category).filter(Boolean))
  ).sort();
  const variants = Array.from(
    new Set(
      (options?.category_variant || [])
        .filter((c) => !form.category || c.category === form.category)
        .map((c) => c.variant)
        .filter(Boolean)
    )
  ).sort();
  const storages = Array.from(
    new Set(
      (options?.category_form || [])
        .filter((c) => !form.category || c.category === form.category)
        .map((c) => c.storage)
        .filter(Boolean)
    )
  ).sort();
  const forms = Array.from(
    new Set(
      (options?.category_preparation || [])
        .filter((c) => !form.category || c.category === form.category)
        .map((c) => c.form)
        .filter(Boolean)
    )
  ).sort();
  const units = Array.from(
    new Set((options?.preparation_unit || []).map((c) => c.default_unit).filter(Boolean))
  ).sort();

  const submit = async () => {
    if (!form.ingredient.trim() || !form.unit.trim()) {
      setMessage({ type: 'error', text: 'Ingredient and unit are required.' });
      return;
    }
    setLoading(true);
    try {
      await addIngredient({
        ingredient: form.ingredient,
        category: form.category,
        variant: form.variant,
        subvariant: form.subvariant,
        storage: form.storage,
        form: form.form,
        origin_id: form.origin_id,
        unit: form.unit,
        quantity: form.quantity ? parseFloat(form.quantity) : 0,
      });
      setMessage({ type: 'success', text: `${form.ingredient} added.` });
      setForm({
        ingredient: '',
        category: '',
        variant: '',
        subvariant: '',
        storage: '',
        form: '',
        origin_id: 'bought',
        unit: '',
        quantity: '',
      });
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.detail || 'Add failed.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title> Add Ingredient | Pantrix</title>
      </Head>
      <Container maxWidth={themeStretch ? false : 'lg'}>
        <Card>
          <CardHeader title="Add New Ingredient" subheader="Create a new ingredient row" />
          <CardContent>
            {message && (
              <Alert severity={message.type} onClose={() => setMessage(null)} sx={{ mb: 2 }}>
                {message.text}
              </Alert>
            )}
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Ingredient *"
                  value={form.ingredient}
                  onChange={(e) => update('ingredient', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Autocomplete
                  freeSolo
                  options={categories}
                  value={form.category}
                  onChange={(_, v) => update('category', v || '')}
                  onInputChange={(_, v) => update('category', v || '')}
                  renderInput={(p) => <TextField {...p} label="Category" />}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Autocomplete
                  freeSolo
                  options={variants}
                  value={form.variant}
                  onChange={(_, v) => update('variant', v || '')}
                  onInputChange={(_, v) => update('variant', v || '')}
                  renderInput={(p) => <TextField {...p} label="Variant" />}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Subvariant"
                  value={form.subvariant}
                  onChange={(e) => update('subvariant', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Autocomplete
                  freeSolo
                  options={storages}
                  value={form.storage}
                  onChange={(_, v) => update('storage', v || '')}
                  onInputChange={(_, v) => update('storage', v || '')}
                  renderInput={(p) => <TextField {...p} label="Storage" />}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Autocomplete
                  freeSolo
                  options={forms}
                  value={form.form}
                  onChange={(_, v) => update('form', v || '')}
                  onInputChange={(_, v) => update('form', v || '')}
                  renderInput={(p) => <TextField {...p} label="Form" />}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Autocomplete
                  freeSolo
                  options={units}
                  value={form.unit}
                  onChange={(_, v) => update('unit', v || '')}
                  onInputChange={(_, v) => update('unit', v || '')}
                  renderInput={(p) => <TextField {...p} label="Unit *" />}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Initial Quantity"
                  type="number"
                  value={form.quantity}
                  onChange={(e) => update('quantity', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Origin"
                  value={form.origin_id}
                  onChange={(e) => update('origin_id', e.target.value)}
                  helperText="E.g. bought, produced"
                />
              </Grid>
            </Grid>
            <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
              <Button variant="contained" onClick={submit} disabled={loading}>
                Add Ingredient
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Container>
    </>
  );
}

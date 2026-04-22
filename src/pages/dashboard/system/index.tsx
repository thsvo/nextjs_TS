import { useState, useEffect } from 'react';
import Head from 'next/head';
import {
  Container,
  Card,
  CardHeader,
  CardContent,
  Grid,
  Button,
  Alert,
  Typography,
  Table,
  TableBody,
  TableRow,
  TableCell,
  Stack,
  Autocomplete,
  TextField,
} from '@mui/material';
import DashboardLayout from '../../../layouts/dashboard';
import { useSettingsContext } from '../../../components/settings';
import {
  resetRestocks,
  resetPosOrders,
  recompute,
  getBackendSummary,
  deleteIngredient,
  getIngredientsUsed,
  IngredientUsedRow,
  BackendSummary,
} from '../../../api/pantrix';

SystemPage.getLayout = (page: React.ReactElement) => <DashboardLayout>{page}</DashboardLayout>;

export default function SystemPage() {
  const { themeStretch } = useSettingsContext();
  const [summary, setSummary] = useState<BackendSummary | null>(null);
  const [ingredients, setIngredients] = useState<IngredientUsedRow[]>([]);
  const [selected, setSelected] = useState<IngredientUsedRow | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const refreshSummary = async () => {
    try {
      setSummary(await getBackendSummary());
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.detail || 'Failed to load summary.' });
    }
  };

  useEffect(() => {
    refreshSummary();
    getIngredientsUsed()
      .then(setIngredients)
      .catch(() => setIngredients([]));
  }, []);

  const runOp = async (op: string, fn: () => Promise<any>, confirm?: string) => {
    if (confirm && !window.confirm(confirm)) return;
    setLoading(op);
    try {
      const r = await fn();
      setMessage({ type: 'success', text: r?.message || `${op} succeeded.` });
      refreshSummary();
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.detail || `${op} failed.` });
    } finally {
      setLoading(null);
    }
  };

  const removeIngredient = async () => {
    if (!selected?.Ing_UID) {
      setMessage({ type: 'error', text: 'Select an ingredient.' });
      return;
    }
    if (!window.confirm(`Permanently delete "${selected.ingredient}" and its history?`)) return;
    setLoading('delete');
    try {
      await deleteIngredient(selected.Ing_UID);
      setMessage({ type: 'success', text: `${selected.ingredient} deleted.` });
      setSelected(null);
      const data = await getIngredientsUsed();
      setIngredients(data);
      refreshSummary();
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.detail || 'Delete failed.' });
    } finally {
      setLoading(null);
    }
  };

  const counts = summary?.counts || {};

  return (
    <>
      <Head>
        <title> System | Pantrix</title>
      </Head>
      <Container maxWidth={themeStretch ? false : 'xl'}>
        {message && (
          <Alert severity={message.type} onClose={() => setMessage(null)} sx={{ mb: 2 }}>
            {message.text}
          </Alert>
        )}
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader title="Backend Summary" subheader="Live database counts" />
              <CardContent>
                <Table size="small">
                  <TableBody>
                    {Object.entries(counts).map(([k, v]) => (
                      <TableRow key={k}>
                        <TableCell sx={{ textTransform: 'capitalize' }}>
                          {k.replace(/_/g, ' ')}
                        </TableCell>
                        <TableCell align="right">
                          <strong>{v as any}</strong>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {summary?.generated_at && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                    Generated {new Date(summary.generated_at).toLocaleString()}
                  </Typography>
                )}
                <Button sx={{ mt: 1 }} size="small" onClick={refreshSummary}>
                  Refresh
                </Button>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader title="Operations" subheader="Destructive actions — use with care" />
              <CardContent>
                <Stack spacing={2}>
                  <Button
                    variant="contained"
                    color="warning"
                    onClick={() =>
                      runOp('recompute', recompute, 'Recompute all derived tables?')
                    }
                    disabled={loading === 'recompute'}
                  >
                    Recompute derived data
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={() =>
                      runOp(
                        'reset-restocks',
                        resetRestocks,
                        'This will delete ALL restock history. Continue?'
                      )
                    }
                    disabled={loading === 'reset-restocks'}
                  >
                    Reset all restocks
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={() =>
                      runOp(
                        'reset-pos-orders',
                        resetPosOrders,
                        'This will delete ALL POS orders. Continue?'
                      )
                    }
                    disabled={loading === 'reset-pos-orders'}
                  >
                    Reset all POS orders
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card>
              <CardHeader
                title="Delete Ingredient"
                subheader="Permanently remove an ingredient and all of its records"
              />
              <CardContent>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
                  <Autocomplete
                    sx={{ flex: 1 }}
                    options={ingredients}
                    getOptionLabel={(o) =>
                      `${o.ingredient} (${[o.variant, o.subvariant, o.storage, o.form]
                        .filter(Boolean)
                        .join(' / ')})`
                    }
                    value={selected}
                    onChange={(_, v) => setSelected(v)}
                    renderInput={(p) => <TextField {...p} label="Ingredient" />}
                  />
                  <Button
                    variant="contained"
                    color="error"
                    onClick={removeIngredient}
                    disabled={!selected || loading === 'delete'}
                  >
                    Delete Ingredient
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </>
  );
}

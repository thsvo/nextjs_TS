import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import {
  Container,
  Card,
  CardHeader,
  CardContent,
  Stack,
  TextField,
  Button,
  Alert,
  MenuItem,
  Grid,
  Typography,
} from '@mui/material';
import DashboardLayout from '../../../layouts/dashboard';
import { useSettingsContext } from '../../../components/settings';
import { posManual, getRecipeMappingSheet, RecipeMappingItem } from '../../../api/pantrix';

PosEntryPage.getLayout = (page: React.ReactElement) => <DashboardLayout>{page}</DashboardLayout>;

export default function PosEntryPage() {
  const { themeStretch } = useSettingsContext();
  const [items, setItems] = useState<RecipeMappingItem[]>([]);
  const [form, setForm] = useState({
    unique_code: '',
    quantity: 1,
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().split(' ')[0].substring(0, 5),
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchItems = useCallback(async () => {
    try {
      const data = await getRecipeMappingSheet();
      setItems(data.items.filter((i) => i.unique_code));
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.detail || 'Failed to load menu items.' });
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const submit = async () => {
    if (!form.unique_code) {
      setMessage({ type: 'error', text: 'Select a menu item.' });
      return;
    }
    setSaving(true);
    try {
      await posManual({
        unique_code: form.unique_code,
        quantity: form.quantity,
        date: form.date,
        time: form.time,
      });
      setMessage({ type: 'success', text: 'POS entry saved.' });
      setForm({ ...form, quantity: 1 });
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.detail || 'Save failed.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Head>
        <title> POS: Manual Entry | Pantrix</title>
      </Head>
      <Container maxWidth={themeStretch ? false : 'md'}>
        <Card>
          <CardHeader title="POS Manual Entry" subheader="Record a single POS order" />
          <CardContent>
            {message && (
              <Alert severity={message.type} onClose={() => setMessage(null)} sx={{ mb: 2 }}>
                {message.text}
              </Alert>
            )}

            <Grid container spacing={2}>
              <Grid item xs={12} sm={8}>
                <TextField
                  select
                  fullWidth
                  label="Menu item"
                  value={form.unique_code}
                  onChange={(e) => setForm({ ...form, unique_code: e.target.value })}
                >
                  {items.map((m) => (
                    <MenuItem key={m.unique_code} value={m.unique_code}>
                      {m.menu_item} ({m.category})
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Quantity"
                  value={form.quantity}
                  inputProps={{ min: 1 }}
                  onChange={(e) => setForm({ ...form, quantity: Math.max(1, Number(e.target.value)) })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Date"
                  InputLabelProps={{ shrink: true }}
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="time"
                  label="Time"
                  InputLabelProps={{ shrink: true }}
                  value={form.time}
                  onChange={(e) => setForm({ ...form, time: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <Stack direction="row" justifyContent="flex-end">
                  <Button variant="contained" onClick={submit} disabled={saving}>
                    Record Order
                  </Button>
                </Stack>
              </Grid>
            </Grid>

            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Tip: bulk imports go through the Upload Data page.
            </Typography>
          </CardContent>
        </Card>
      </Container>
    </>
  );
}

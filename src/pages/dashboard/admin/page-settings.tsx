import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import {
  Container,
  Card,
  CardHeader,
  CardContent,
  Stack,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Button,
  Alert,
  Typography,
} from '@mui/material';
import DashboardLayout from '../../../layouts/dashboard';
import { useSettingsContext } from '../../../components/settings';
import {
  getClientPageSettings,
  saveClientPageSettings,
  ClientPageSettings,
} from '../../../api/pantrix';

PageSettingsPage.getLayout = (page: React.ReactElement) => (
  <DashboardLayout>{page}</DashboardLayout>
);

export default function PageSettingsPage() {
  const { themeStretch } = useSettingsContext();
  const [data, setData] = useState<ClientPageSettings | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await getClientPageSettings();
      setData(res);
      setSelected(new Set(res.pages));
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.detail || 'Failed to load settings.' });
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggle = (key: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const save = async () => {
    if (!data) return;
    setSaving(true);
    try {
      await saveClientPageSettings(Array.from(selected));
      setMessage({ type: 'success', text: 'Page visibility updated.' });
      fetchData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.detail || 'Save failed.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Head>
        <title> Admin: Page Settings | Pantrix</title>
      </Head>
      <Container maxWidth={themeStretch ? false : 'md'}>
        <Card>
          <CardHeader
            title="Client Page Visibility"
            subheader="Choose which pages client-role users can access"
          />
          <CardContent>
            {message && (
              <Alert severity={message.type} onClose={() => setMessage(null)} sx={{ mb: 2 }}>
                {message.text}
              </Alert>
            )}

            {!data && <Typography variant="body2">Loading…</Typography>}

            {data && (
              <Stack spacing={2}>
                <FormGroup>
                  {data.configurable_pages.map((key, idx) => (
                    <FormControlLabel
                      key={key}
                      control={
                        <Checkbox checked={selected.has(key)} onChange={() => toggle(key)} />
                      }
                      label={data.configurable_labels[idx] || key}
                    />
                  ))}
                </FormGroup>

                <Button variant="contained" onClick={save} disabled={saving}>
                  Save
                </Button>
              </Stack>
            )}
          </CardContent>
        </Card>
      </Container>
    </>
  );
}

import { useState, useEffect, useCallback } from 'react';
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
  Button,
  TextField,
  Alert,
  Stack,
} from '@mui/material';
import DashboardLayout from '../../../layouts/dashboard';
import { useSettingsContext } from '../../../components/settings';
import { TableHeadCustom } from '../../../components/table';
import Scrollbar from '../../../components/scrollbar';
import { getAlterPortioningData, saveAlterPortioningData } from '../../../api/pantrix';

const HEAD = [
  { id: 'ingredient', label: 'Ingredient' },
  { id: 'variant', label: 'Variant' },
  { id: 'size', label: 'Portion Size' },
  { id: 'unit', label: 'Unit' },
  { id: 'current', label: 'Current' },
];

AlterPortioningPage.getLayout = (page: React.ReactElement) => (
  <DashboardLayout>{page}</DashboardLayout>
);

export default function AlterPortioningPage() {
  const { themeStretch } = useSettingsContext();
  const [rows, setRows] = useState<any[]>([]);
  const [edits, setEdits] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setRows(await getAlterPortioningData(500));
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.detail || 'Failed to load portioning data.' });
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const uidOf = (r: any) => r.Portion_UID || r.portion_uid || r.id;

  const patch = (r: any, field: string, value: string) => {
    const id = uidOf(r);
    setEdits((prev) => ({
      ...prev,
      [id]: { ...(prev[id] || { ...r }), [field]: value },
    }));
  };

  const save = async () => {
    const items = Object.values(edits);
    if (items.length === 0) {
      setMessage({ type: 'error', text: 'No changes to save.' });
      return;
    }
    setLoading(true);
    try {
      await saveAlterPortioningData(items);
      setMessage({ type: 'success', text: `Saved ${items.length} row(s).` });
      setEdits({});
      fetchData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.detail || 'Save failed.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title> Alter Portioning Data | Pantrix</title>
      </Head>
      <Container maxWidth={themeStretch ? false : 'xl'}>
        <Card>
          <CardHeader
            title="Alter Portioning Data"
            subheader="Edit portion sizes, units, and current balances"
            action={
              <Stack direction="row" spacing={1}>
                <Button variant="outlined" onClick={fetchData} disabled={loading}>
                  Reload
                </Button>
                <Button
                  variant="contained"
                  onClick={save}
                  disabled={loading || Object.keys(edits).length === 0}
                >
                  Save {Object.keys(edits).length > 0 ? `(${Object.keys(edits).length})` : ''}
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
            <TableContainer>
              <Scrollbar>
                <Table sx={{ minWidth: 900 }}>
                  <TableHeadCustom headLabel={HEAD} />
                  <TableBody>
                    {rows.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={HEAD.length} align="center">
                          No portioning data.
                        </TableCell>
                      </TableRow>
                    )}
                    {rows.map((r) => {
                      const id = uidOf(r);
                      const e = edits[id] || {};
                      return (
                        <TableRow key={id}>
                          <TableCell sx={{ fontWeight: 'bold' }}>{r.ingredient}</TableCell>
                          <TableCell>
                            {[r.variant, r.subvariant, r.storage, r.form]
                              .filter(Boolean)
                              .join(' / ')}
                          </TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              type="number"
                              defaultValue={r.portion_size}
                              onChange={(ev) => patch(r, 'portion_size', ev.target.value)}
                              sx={{ width: 110 }}
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              defaultValue={r.portion_unit || r.unit}
                              onChange={(ev) => patch(r, 'portion_unit', ev.target.value)}
                              sx={{ width: 110 }}
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              type="number"
                              defaultValue={r.current_portions ?? r.current_balance ?? 0}
                              onChange={(ev) => patch(r, 'current_portions', ev.target.value)}
                              sx={{ width: 110 }}
                            />
                            {e.current_portions !== undefined && ' •'}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Scrollbar>
            </TableContainer>
          </CardContent>
        </Card>
      </Container>
    </>
  );
}

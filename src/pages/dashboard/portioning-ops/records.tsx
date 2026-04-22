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
import {
  getEditPortioningRecords,
  editPortioningRecord,
  editPortioningRecordRemove,
} from '../../../api/pantrix';

const HEAD = [
  { id: 'ingredient', label: 'Ingredient' },
  { id: 'variant', label: 'Variant' },
  { id: 'size', label: 'Portion Size' },
  { id: 'qty', label: 'Quantity' },
  { id: 'balance', label: 'Balance' },
  { id: 'action', label: 'Action' },
];

PortioningRecordsPage.getLayout = (page: React.ReactElement) => (
  <DashboardLayout>{page}</DashboardLayout>
);

export default function PortioningRecordsPage() {
  const { themeStretch } = useSettingsContext();
  const [records, setRecords] = useState<any[]>([]);
  const [drafts, setDrafts] = useState<Record<number, string>>({});
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setRecords(await getEditPortioningRecords());
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.detail || 'Failed to load portioning records.' });
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const save = async (id: number) => {
    const raw = drafts[id];
    if (raw === undefined) return;
    try {
      await editPortioningRecord(id, parseFloat(raw) || 0);
      setMessage({ type: 'success', text: `Updated record #${id}.` });
      setDrafts((prev) => {
        const { [id]: _, ...rest } = prev;
        return rest;
      });
      fetchData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.detail || 'Update failed.' });
    }
  };

  const remove = async (id: number) => {
    if (!window.confirm(`Remove portioning record #${id}?`)) return;
    try {
      await editPortioningRecordRemove(id);
      setMessage({ type: 'success', text: `Removed record #${id}.` });
      fetchData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.detail || 'Remove failed.' });
    }
  };

  return (
    <>
      <Head>
        <title> Portioning: Edit Records | Pantrix</title>
      </Head>
      <Container maxWidth={themeStretch ? false : 'xl'}>
        <Card>
          <CardHeader title="Edit Portioning Records" />
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
                    {records.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={HEAD.length} align="center">
                          No records.
                        </TableCell>
                      </TableRow>
                    )}
                    {records.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell sx={{ fontWeight: 'bold' }}>{r.ingredient}</TableCell>
                        <TableCell>
                          {[r.variant, r.subvariant, r.storage, r.form].filter(Boolean).join(' / ')}
                        </TableCell>
                        <TableCell>
                          {r.portion_size} {r.portion_unit}
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            type="number"
                            value={drafts[r.id] ?? String(r.quantity)}
                            onChange={(e) =>
                              setDrafts({ ...drafts, [r.id]: e.target.value })
                            }
                            sx={{ width: 120 }}
                          />
                        </TableCell>
                        <TableCell>
                          {r.balance_at_end} {r.unit}
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={1}>
                            <Button
                              size="small"
                              variant="contained"
                              onClick={() => save(r.id)}
                              disabled={drafts[r.id] === undefined}
                            >
                              Save
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              color="error"
                              onClick={() => remove(r.id)}
                            >
                              Remove
                            </Button>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
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

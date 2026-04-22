import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import {
  Container,
  Card,
  CardHeader,
  CardContent,
  Stack,
  Table,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Button,
  TextField,
  Alert,
  MenuItem,
} from '@mui/material';
import DashboardLayout from '../../../layouts/dashboard';
import { useSettingsContext } from '../../../components/settings';
import { TableHeadCustom } from '../../../components/table';
import Scrollbar from '../../../components/scrollbar';
import Label from '../../../components/label';
import {
  getEditRestocks,
  editRestock,
  editRestockRemoveItem,
  editRestockUndoRemoveItem,
  EditRestockRow,
} from '../../../api/pantrix';

const HEAD = [
  { id: 'date', label: 'Date' },
  { id: 'ingredient', label: 'Ingredient' },
  { id: 'qty', label: 'Quantity' },
  { id: 'cost', label: 'Total Cost' },
  { id: 'status', label: 'Status' },
  { id: 'action', label: 'Action' },
];

EditRestocksPage.getLayout = (page: React.ReactElement) => (
  <DashboardLayout>{page}</DashboardLayout>
);

export default function EditRestocksPage() {
  const { themeStretch } = useSettingsContext();
  const [days, setDays] = useState(7);
  const [rows, setRows] = useState<EditRestockRow[]>([]);
  const [drafts, setDrafts] = useState<Record<number, { quantity: string; cost: string }>>({});
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const data = await getEditRestocks({ days });
      setRows(data.restocks);
      setDrafts({});
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.detail || 'Failed to load restocks.' });
    }
  }, [days]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const saveRow = async (r: EditRestockRow) => {
    const d = drafts[r.id] || { quantity: String(r.quantity), cost: String(r.total_cost) };
    try {
      await editRestock(
        r.id,
        parseFloat(d.quantity) || 0,
        d.cost === '' ? null : parseFloat(d.cost)
      );
      setMessage({ type: 'success', text: `Updated restock #${r.id}.` });
      fetchData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.detail || 'Update failed.' });
    }
  };

  const removeRow = async (id: number) => {
    if (!window.confirm(`Remove restock #${id}?`)) return;
    try {
      await editRestockRemoveItem(id);
      setMessage({ type: 'success', text: `Removed restock #${id}.` });
      fetchData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.detail || 'Remove failed.' });
    }
  };

  const undoRemove = async (undo_id: number) => {
    try {
      await editRestockUndoRemoveItem(undo_id);
      setMessage({ type: 'success', text: 'Undone.' });
      fetchData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.detail || 'Undo failed.' });
    }
  };

  return (
    <>
      <Head>
        <title> Restock: Edit | Pantrix</title>
      </Head>
      <Container maxWidth={themeStretch ? false : 'xl'}>
        <Card>
          <CardHeader
            title="Edit Restocks"
            subheader="Update quantities or remove recent restock entries"
            action={
              <TextField
                select
                size="small"
                label="Window"
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                sx={{ width: 150 }}
              >
                {[7, 14, 30, 60, 90].map((d) => (
                  <MenuItem key={d} value={d}>
                    Last {d} days
                  </MenuItem>
                ))}
              </TextField>
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
                          No restocks in window.
                        </TableCell>
                      </TableRow>
                    )}
                    {rows.map((r) => {
                      const d = drafts[r.id] || {
                        quantity: String(r.quantity),
                        cost: String(r.total_cost),
                      };
                      return (
                        <TableRow key={r.id}>
                          <TableCell>{r.date}</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>{r.ingredient}</TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              type="number"
                              value={d.quantity}
                              onChange={(e) =>
                                setDrafts({
                                  ...drafts,
                                  [r.id]: { ...d, quantity: e.target.value },
                                })
                              }
                              sx={{ width: 110 }}
                              InputProps={{ endAdornment: r.unit }}
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              type="number"
                              value={d.cost}
                              onChange={(e) =>
                                setDrafts({
                                  ...drafts,
                                  [r.id]: { ...d, cost: e.target.value },
                                })
                              }
                              sx={{ width: 120 }}
                            />
                          </TableCell>
                          <TableCell>
                            <Label color={r.pending_remove ? 'warning' : 'success'}>
                              {r.pending_remove ? 'Pending remove' : 'Active'}
                            </Label>
                          </TableCell>
                          <TableCell>
                            <Stack direction="row" spacing={1}>
                              {r.pending_remove && r.undo_id ? (
                                <Button
                                  size="small"
                                  variant="outlined"
                                  onClick={() => undoRemove(r.undo_id as number)}
                                >
                                  Undo
                                </Button>
                              ) : (
                                <>
                                  <Button
                                    size="small"
                                    variant="contained"
                                    onClick={() => saveRow(r)}
                                  >
                                    Save
                                  </Button>
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    color="error"
                                    onClick={() => removeRow(r.id)}
                                  >
                                    Remove
                                  </Button>
                                </>
                              )}
                            </Stack>
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

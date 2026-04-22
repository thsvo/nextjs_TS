import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import {
  Container,
  Grid,
  Card,
  CardHeader,
  Table,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Button,
  TextField,
  Stack,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import DashboardLayout from '../../../layouts/dashboard';
import { useSettingsContext } from '../../../components/settings';
import Scrollbar from '../../../components/scrollbar';
import { TableHeadCustom } from '../../../components/table';
import Label from '../../../components/label';
import {
  listRestaurants,
  createRestaurant,
  deleteRestaurant,
  Restaurant,
} from '../../../api/pantrix';

const TABLE_LABELS = [
  { id: 'id', label: 'ID' },
  { id: 'name', label: 'Name' },
  { id: 'group', label: 'Group' },
  { id: 'status', label: 'Status' },
  { id: 'created', label: 'Created' },
  { id: 'action', label: 'Action' },
];

AdminRestaurantsPage.getLayout = (page: React.ReactElement) => (
  <DashboardLayout>{page}</DashboardLayout>
);

export default function AdminRestaurantsPage() {
  const { themeStretch } = useSettingsContext();

  const [rows, setRows] = useState<Restaurant[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', group_name: '' });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setRows(await listRestaurants());
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.detail || 'Failed to load restaurants.' });
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreate = async () => {
    if (!form.name.trim()) {
      setMessage({ type: 'error', text: 'Name is required.' });
      return;
    }
    try {
      await createRestaurant(form.name.trim(), form.group_name.trim());
      setMessage({ type: 'success', text: 'Restaurant created.' });
      setOpen(false);
      setForm({ name: '', group_name: '' });
      fetchData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.detail || 'Create failed.' });
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm(`Deactivate restaurant ${id}? All its users will lose access.`)) return;
    try {
      await deleteRestaurant(id);
      setMessage({ type: 'success', text: `Restaurant ${id} deactivated.` });
      fetchData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.detail || 'Delete failed.' });
    }
  };

  return (
    <>
      <Head>
        <title> Admin: Restaurants | Pantrix</title>
      </Head>

      <Container maxWidth={themeStretch ? false : 'xl'}>
        {message && (
          <Alert severity={message.type} onClose={() => setMessage(null)} sx={{ mb: 2 }}>
            {message.text}
          </Alert>
        )}

        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardHeader
                title="Restaurants"
                subheader="Admin-only tenant management"
                action={
                  <Button variant="contained" onClick={() => setOpen(true)}>
                    New Restaurant
                  </Button>
                }
                sx={{ mb: 2 }}
              />

              <TableContainer>
                <Scrollbar>
                  <Table sx={{ minWidth: 800 }}>
                    <TableHeadCustom headLabel={TABLE_LABELS} />
                    <TableBody>
                      {rows.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell>{r.id}</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>{r.name}</TableCell>
                          <TableCell>{r.group_name}</TableCell>
                          <TableCell>
                            <Label color={r.is_active ? 'success' : 'default'}>
                              {r.is_active ? 'Active' : 'Inactive'}
                            </Label>
                          </TableCell>
                          <TableCell>{r.created_at}</TableCell>
                          <TableCell>
                            {r.is_active && (
                              <Button
                                size="small"
                                color="error"
                                variant="outlined"
                                onClick={() => handleDelete(r.id)}
                              >
                                Deactivate
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Scrollbar>
              </TableContainer>
            </Card>
          </Grid>
        </Grid>
      </Container>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Create Restaurant</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Name"
              fullWidth
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <TextField
              label="Group"
              fullWidth
              value={form.group_name}
              onChange={(e) => setForm({ ...form, group_name: e.target.value })}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate}>
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

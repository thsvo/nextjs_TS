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
  MenuItem,
} from '@mui/material';
import DashboardLayout from '../../../layouts/dashboard';
import { useSettingsContext } from '../../../components/settings';
import Scrollbar from '../../../components/scrollbar';
import { TableHeadCustom } from '../../../components/table';
import Label from '../../../components/label';
import {
  listUsers,
  listRestaurants,
  createUser,
  setUserPassword,
  deleteUser,
  AppUser,
  Restaurant,
} from '../../../api/pantrix';

const TABLE_LABELS = [
  { id: 'id', label: 'ID' },
  { id: 'username', label: 'Username' },
  { id: 'role', label: 'Role' },
  { id: 'restaurant', label: 'Restaurant' },
  { id: 'status', label: 'Status' },
  { id: 'action', label: 'Action' },
];

AdminUsersPage.getLayout = (page: React.ReactElement) => <DashboardLayout>{page}</DashboardLayout>;

export default function AdminUsersPage() {
  const { themeStretch } = useSettingsContext();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [openNew, setOpenNew] = useState(false);
  const [openPwd, setOpenPwd] = useState<AppUser | null>(null);
  const [form, setForm] = useState({
    restaurant_id: 1,
    username: '',
    password: '',
    role: 'client' as 'client' | 'admin',
  });
  const [pwd, setPwd] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [u, r] = await Promise.all([listUsers(), listRestaurants()]);
      setUsers(u);
      setRestaurants(r);
      if (r.length && form.restaurant_id === 1 && !r.find((x) => x.id === 1)) {
        setForm((prev) => ({ ...prev, restaurant_id: r[0].id }));
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.detail || 'Failed to load users.' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreate = async () => {
    if (!form.username || !form.password) {
      setMessage({ type: 'error', text: 'Username and password are required.' });
      return;
    }
    try {
      await createUser(form.restaurant_id, form.username, form.password, form.role);
      setMessage({ type: 'success', text: `User ${form.username} created.` });
      setOpenNew(false);
      setForm({ ...form, username: '', password: '' });
      fetchData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.detail || 'Create failed.' });
    }
  };

  const handleSetPassword = async () => {
    if (!openPwd || !pwd) return;
    try {
      await setUserPassword(openPwd.username, pwd);
      setMessage({ type: 'success', text: `Password updated for ${openPwd.username}.` });
      setOpenPwd(null);
      setPwd('');
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.detail || 'Update failed.' });
    }
  };

  const handleDelete = async (user: AppUser) => {
    if (!window.confirm(`Deactivate user ${user.username}?`)) return;
    try {
      await deleteUser(user.id);
      setMessage({ type: 'success', text: `User ${user.username} deactivated.` });
      fetchData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.detail || 'Delete failed.' });
    }
  };

  return (
    <>
      <Head>
        <title> Admin: Users | Pantrix</title>
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
                title="Users"
                subheader="Admin-only user provisioning"
                action={
                  <Button variant="contained" onClick={() => setOpenNew(true)}>
                    New User
                  </Button>
                }
                sx={{ mb: 2 }}
              />

              <TableContainer>
                <Scrollbar>
                  <Table sx={{ minWidth: 800 }}>
                    <TableHeadCustom headLabel={TABLE_LABELS} />
                    <TableBody>
                      {users.map((u) => (
                        <TableRow key={u.id}>
                          <TableCell>{u.id}</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>{u.username}</TableCell>
                          <TableCell>
                            <Label color={u.role === 'admin' ? 'primary' : 'default'}>
                              {u.role}
                            </Label>
                          </TableCell>
                          <TableCell>
                            {u.restaurant_name} (#{u.restaurant_id})
                          </TableCell>
                          <TableCell>
                            <Label color={u.is_active ? 'success' : 'default'}>
                              {u.is_active ? 'Active' : 'Inactive'}
                            </Label>
                          </TableCell>
                          <TableCell>
                            <Stack direction="row" spacing={1}>
                              <Button size="small" variant="outlined" onClick={() => setOpenPwd(u)}>
                                Set Password
                              </Button>
                              {u.is_active && (
                                <Button
                                  size="small"
                                  color="error"
                                  variant="outlined"
                                  onClick={() => handleDelete(u)}
                                >
                                  Deactivate
                                </Button>
                              )}
                            </Stack>
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

      <Dialog open={openNew} onClose={() => setOpenNew(false)} fullWidth maxWidth="sm">
        <DialogTitle>Create User</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              select
              label="Restaurant"
              value={form.restaurant_id}
              onChange={(e) => setForm({ ...form, restaurant_id: Number(e.target.value) })}
            >
              {restaurants.map((r) => (
                <MenuItem key={r.id} value={r.id}>
                  #{r.id} — {r.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Username"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
            />
            <TextField
              label="Password"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            <TextField
              select
              label="Role"
              value={form.role}
              onChange={(e) =>
                setForm({ ...form, role: e.target.value as 'client' | 'admin' })
              }
            >
              <MenuItem value="client">Client</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenNew(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate}>
            Create
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!openPwd} onClose={() => setOpenPwd(null)} fullWidth maxWidth="sm">
        <DialogTitle>Set password — {openPwd?.username}</DialogTitle>
        <DialogContent>
          <TextField
            sx={{ mt: 1 }}
            fullWidth
            label="New password"
            type="password"
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPwd(null)}>Cancel</Button>
          <Button variant="contained" onClick={handleSetPassword} disabled={!pwd}>
            Update
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

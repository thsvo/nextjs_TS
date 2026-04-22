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
} from '@mui/material';
import DashboardLayout from '../../../layouts/dashboard';
import { useSettingsContext } from '../../../components/settings';
import { TableHeadCustom } from '../../../components/table';
import Scrollbar from '../../../components/scrollbar';
import { getPortioningRestockItems, portioningRestockAdd } from '../../../api/pantrix';

const HEAD = [
  { id: 'category', label: 'Category' },
  { id: 'ingredient', label: 'Ingredient' },
  { id: 'variant', label: 'Variant' },
  { id: 'size', label: 'Portion Size' },
  { id: 'current', label: 'Current' },
  { id: 'qty', label: 'Add Portions' },
  { id: 'action', label: 'Action' },
];

PortioningRestockPage.getLayout = (page: React.ReactElement) => (
  <DashboardLayout>{page}</DashboardLayout>
);

export default function PortioningRestockPage() {
  const { themeStretch } = useSettingsContext();
  const [rows, setRows] = useState<any[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setRows(await getPortioningRestockItems());
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.detail || 'Failed to load portions.' });
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const add = async (portionUid: string) => {
    const q = drafts[portionUid];
    if (!q) {
      setMessage({ type: 'error', text: 'Enter a quantity.' });
      return;
    }
    try {
      await portioningRestockAdd(portionUid, parseFloat(q));
      setMessage({ type: 'success', text: 'Portions added.' });
      setDrafts((prev) => {
        const rest = { ...prev };
        delete rest[portionUid];
        return rest;
      });
      fetchData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.detail || 'Add failed.' });
    }
  };

  return (
    <>
      <Head>
        <title> Portioning: Restock | Pantrix</title>
      </Head>
      <Container maxWidth={themeStretch ? false : 'xl'}>
        <Card>
          <CardHeader
            title="Portioning Restock"
            subheader="Add portioned inventory directly"
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
                          No portions.
                        </TableCell>
                      </TableRow>
                    )}
                    {rows.map((r) => {
                      const uid = r.Portion_UID || r.portion_uid;
                      return (
                        <TableRow key={uid}>
                          <TableCell>{r.category}</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>{r.ingredient}</TableCell>
                          <TableCell>
                            {[r.variant, r.subvariant, r.storage, r.form]
                              .filter(Boolean)
                              .join(' / ')}
                          </TableCell>
                          <TableCell>
                            {r.portion_size} {r.portion_unit}
                          </TableCell>
                          <TableCell>{r.current_portions ?? r.current_balance ?? 0}</TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              type="number"
                              value={drafts[uid] ?? ''}
                              onChange={(e) => setDrafts({ ...drafts, [uid]: e.target.value })}
                              sx={{ width: 120 }}
                            />
                          </TableCell>
                          <TableCell>
                            <Button
                              size="small"
                              variant="contained"
                              onClick={() => add(uid)}
                              disabled={!drafts[uid]}
                            >
                              Add
                            </Button>
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

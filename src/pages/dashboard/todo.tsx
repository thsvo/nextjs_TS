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
} from '@mui/material';
import DashboardLayout from '../../layouts/dashboard';
import { useSettingsContext } from '../../components/settings';
import Scrollbar from '../../components/scrollbar';
import { TableHeadCustom } from '../../components/table';
import { getTodoRestocks, updateRestockCost, TodoRestock } from '../../api/pantrix';

// ----------------------------------------------------------------------

const TABLE_LABELS = [
  { id: 'date', label: 'Date' },
  { id: 'ingredient', label: 'Ingredient' },
  { id: 'quantity', label: 'Quantity' },
  { id: 'unit', label: 'Unit' },
  { id: 'cost', label: 'Add Cost' },
  { id: 'action', label: '' },
];

ToDoListPage.getLayout = (page: React.ReactElement) => <DashboardLayout>{page}</DashboardLayout>;

// ----------------------------------------------------------------------

export default function ToDoListPage() {
  const { themeStretch } = useSettingsContext();

  const [todoItems, setTodoItems] = useState<TodoRestock[]>([]);
  const [costs, setCosts] = useState<Record<number, string>>({});
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const items = await getTodoRestocks();
      setTodoItems(items);
    } catch (error) {
      console.error('Failed to fetch todo items:', error);
      setMessage({ type: 'error', text: 'Failed to load to-do list.' });
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCostChange = (id: number, value: string) => {
    setCosts({ ...costs, [id]: value });
  };

  const handleSaveCost = async (id: number) => {
    const cost = costs[id];
    if (!cost) return;
    try {
      await updateRestockCost(id, parseFloat(cost));
      setMessage({ type: 'success', text: 'Cost saved.' });
      setCosts((prev) => {
        const rest = { ...prev };
        delete rest[id];
        return rest;
      });
      fetchData();
    } catch (error) {
      console.error('Failed to save cost:', error);
      setMessage({ type: 'error', text: 'Failed to save cost.' });
    }
  };

  return (
    <>
      <Head>
        <title> Restock: To-Do List | Pantrix</title>
      </Head>

      <Container maxWidth={themeStretch ? false : 'xl'}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardHeader
                title="To-Do List"
                subheader="Pending restocks requiring cost input"
                sx={{ mb: 3 }}
              />

              {message && (
                <Stack sx={{ px: 3, pb: 2 }}>
                  <Alert severity={message.type} onClose={() => setMessage(null)}>
                    {message.text}
                  </Alert>
                </Stack>
              )}

              <TableContainer sx={{ overflow: 'unset' }}>
                <Scrollbar>
                  <Table sx={{ minWidth: 800 }}>
                    <TableHeadCustom headLabel={TABLE_LABELS} />

                    <TableBody>
                      {todoItems.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={TABLE_LABELS.length} align="center">
                            No pending restocks.
                          </TableCell>
                        </TableRow>
                      )}

                      {todoItems.map((row, idx) => {
                        const [id, date, ingredient, quantity, unit] = row;
                        return (
                          <TableRow key={`${id}-${idx}`}>
                            <TableCell>{date}</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>{ingredient}</TableCell>
                            <TableCell>{quantity}</TableCell>
                            <TableCell>{unit}</TableCell>
                            <TableCell>
                              <TextField
                                size="small"
                                type="number"
                                placeholder="Total Cost"
                                value={costs[id] ?? ''}
                                onChange={(e) => handleCostChange(id, e.target.value)}
                              />
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="contained"
                                color="success"
                                onClick={() => handleSaveCost(id)}
                                disabled={!costs[id]}
                              >
                                Save
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </Scrollbar>
              </TableContainer>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </>
  );
}

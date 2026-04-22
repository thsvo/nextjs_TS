/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback, useMemo } from 'react';
import Head from 'next/head';
import {
  Container,
  Card,
  CardHeader,
  CardContent,
  Stack,
  Button,
  TextField,
  MenuItem,
  Table,
  TableBody,
  TableRow,
  TableCell,
  TableHead,
  TableContainer,
  TablePagination,
  Alert,
  LinearProgress,
  Typography,
} from '@mui/material';
import DashboardLayout from '../../../layouts/dashboard';
import { useSettingsContext } from '../../../components/settings';
import Scrollbar from '../../../components/scrollbar';
import {
  getIngredientsUsed,
  updateIngredientLevel,
  IngredientUsedRow,
} from '../../../api/pantrix';
import { exportRowsToExcel } from '../../../utils/exportExcel';

type FullFilter = 'all' | 'zero' | 'nonzero';

IngredientsUsedPage.getLayout = (page: React.ReactElement) => (
  <DashboardLayout>{page}</DashboardLayout>
);

export default function IngredientsUsedPage() {
  const { themeStretch } = useSettingsContext();
  const [rows, setRows] = useState<IngredientUsedRow[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FullFilter>('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [loading, setLoading] = useState(false);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getIngredientsUsed();
      setRows(data);
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.detail || 'Failed to load ingredients.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredRows = useMemo(() => {
    let list = rows;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (r) =>
          String(r.ingredient || '')
            .toLowerCase()
            .includes(q) ||
          String(r.category || '')
            .toLowerCase()
            .includes(q)
      );
    }
    if (filter === 'zero') list = list.filter((r) => Number(r.level_at_full ?? 0) === 0);
    if (filter === 'nonzero') list = list.filter((r) => Number(r.level_at_full ?? 0) > 0);
    return list;
  }, [rows, search, filter]);

  const paginated = useMemo(
    () => filteredRows.slice(page * rowsPerPage, (page + 1) * rowsPerPage),
    [filteredRows, page, rowsPerPage]
  );

  const saveLevel = async (ingredient: string) => {
    const value = edits[ingredient];
    if (value === undefined) return;
    try {
      await updateIngredientLevel(ingredient, parseFloat(value) || 0);
      setMessage({ type: 'success', text: `${ingredient}: level updated.` });
      setEdits((prev) => {
        const { [ingredient]: _, ...rest } = prev;
        return rest;
      });
      fetchData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.detail || 'Save failed.' });
    }
  };

  const handleExport = () => {
    exportRowsToExcel(
      filteredRows.map((r) => ({
        Category: r.category,
        Ingredient: r.ingredient,
        Storage: r.storage,
        Type: r.type,
        Unit: r.unit,
        'Level at full': r.level_at_full,
        Origin: r.origin_id,
      })),
      `ingredients_used_${new Date().toISOString().slice(0, 10)}.xlsx`,
      'Ingredients'
    );
  };

  return (
    <>
      <Head>
        <title> Ingredients Used | Pantrix</title>
      </Head>
      <Container maxWidth={themeStretch ? false : 'xl'}>
        <Card>
          <CardHeader
            title="Ingredients Used"
            subheader="All ingredients referenced by menu mappings"
          />
          <CardContent>
            {message && (
              <Alert severity={message.type} onClose={() => setMessage(null)} sx={{ mb: 2 }}>
                {message.text}
              </Alert>
            )}

            <Stack
              direction={{ xs: 'column', md: 'row' }}
              spacing={2}
              sx={{ mb: 2 }}
              alignItems={{ md: 'center' }}
            >
              <TextField
                size="small"
                label="Search ingredient"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
                sx={{ minWidth: 260 }}
              />
              <TextField
                select
                size="small"
                label="Level at full"
                value={filter}
                onChange={(e) => {
                  setFilter(e.target.value as FullFilter);
                  setPage(0);
                }}
                sx={{ minWidth: 200 }}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="zero">= 0</MenuItem>
                <MenuItem value="nonzero">&gt; 0</MenuItem>
              </TextField>
              <Button
                variant="outlined"
                onClick={() => {
                  setSearch('');
                  setFilter('all');
                  setPage(0);
                  fetchData();
                }}
              >
                Clear
              </Button>
              <Button variant="contained" color="success" onClick={handleExport}>
                Export to Excel
              </Button>
            </Stack>

            {loading && <LinearProgress sx={{ mb: 1 }} />}

            <TableContainer>
              <Scrollbar>
                <Table sx={{ minWidth: 900 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Category</TableCell>
                      <TableCell>Ingredient</TableCell>
                      <TableCell>Storage</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Unit</TableCell>
                      <TableCell>Level at full</TableCell>
                      <TableCell>Origin</TableCell>
                      <TableCell>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginated.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} align="center">
                          <Typography color="text.secondary">No ingredients found.</Typography>
                        </TableCell>
                      </TableRow>
                    )}
                    {paginated.map((r, i) => {
                      const draft = edits[r.ingredient];
                      return (
                        <TableRow key={`${r.ingredient}-${i}`} hover>
                          <TableCell>{r.category}</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>{r.ingredient}</TableCell>
                          <TableCell>{r.storage}</TableCell>
                          <TableCell>{r.type}</TableCell>
                          <TableCell>{r.unit}</TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              type="number"
                              value={draft ?? String(r.level_at_full ?? 0)}
                              onChange={(e) =>
                                setEdits({ ...edits, [r.ingredient]: e.target.value })
                              }
                              sx={{ width: 110 }}
                            />
                          </TableCell>
                          <TableCell>{r.origin_id || 'bought'}</TableCell>
                          <TableCell>
                            <Button
                              size="small"
                              variant="contained"
                              disabled={draft === undefined}
                              onClick={() => saveLevel(r.ingredient)}
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

            <TablePagination
              component="div"
              count={filteredRows.length}
              page={page}
              onPageChange={(_, p) => setPage(p)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              rowsPerPageOptions={[10, 25, 50, 100]}
            />
          </CardContent>
        </Card>
      </Container>
    </>
  );
}

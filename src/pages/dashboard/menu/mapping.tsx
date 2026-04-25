/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback, useMemo } from 'react';
import Head from 'next/head';
import {
  Container,
  Grid,
  Card,
  CardHeader,
  CardContent,
  Table,
  TableBody,
  TableRow,
  TableCell,
  TableHead,
  TableContainer,
  TablePagination,
  Button,
  Stack,
  Alert,
  TextField,
  MenuItem,
  IconButton,
  LinearProgress,
  Typography,
  Autocomplete,
  Popover,
  List,
  ListItemButton,
  ListItemText,
  Chip,
} from '@mui/material';
import DashboardLayout from '../../../layouts/dashboard';
import { useSettingsContext } from '../../../components/settings';
import Scrollbar from '../../../components/scrollbar';
import Label from '../../../components/label';
import Iconify from '../../../components/iconify';
import {
  getRecipeMappingSheet,
  getRecipeMappingDetails,
  saveRecipeMapping,
  getPrepopulateRecipe,
  getPrepopulateMenuItems,
  recompute,
  addIngredient,
  RecipeMappingItem,
  PrepopulateMenuItem,
} from '../../../api/pantrix';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  FilterableHeader,
  applyColumnFilters,
} from '../../../components/pantrix/ColumnFilter';

type EditableRow = {
  ingredient: string;
  type1: string;
  subvariant: string;
  type2: string;
  form: string;
  origin_id: string;
  quantity: number;
  unit: string;
};

MenuMappingPage.getLayout = (page: React.ReactElement) => (
  <DashboardLayout>{page}</DashboardLayout>
);

function decorate(items: RecipeMappingItem[]) {
  return items.map((i) => ({
    ...i,
    status: i.is_mapped ? 'Mapped' : 'Pending',
  }));
}

export default function MenuMappingPage() {
  const { themeStretch } = useSettingsContext();
  const [rawItems, setRawItems] = useState<RecipeMappingItem[]>([]);
  const [ingredientOptions, setIngredientOptions] = useState<string[]>([]);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [recipeRows, setRecipeRows] = useState<EditableRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [sheetLoading, setSheetLoading] = useState(false);
  const [recalcLoading, setRecalcLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, string[] | null>>({});
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [prepopOptions, setPrepopOptions] = useState<PrepopulateMenuItem[]>([]);
  const [prepopAnchor, setPrepopAnchor] = useState<HTMLElement | null>(null);
  const [prepopSearch, setPrepopSearch] = useState('');
  const [openAddMenu, setOpenAddMenu] = useState(false);
  const [newMenuName, setNewMenuName] = useState('');
  const [addingMenu, setAddingMenu] = useState(false);

  const setFilter = (field: string, value: string[] | null) =>
    setFilters((prev) => ({ ...prev, [field]: value }));

  const items = useMemo(() => decorate(rawItems), [rawItems]);

  const fetchSheet = useCallback(
    async (term?: string) => {
      setSheetLoading(true);
      try {
        const data = await getRecipeMappingSheet(term);
        setRawItems(data.items || []);
        setIngredientOptions((data.ingredients || []).map((i) => i.ingredient).filter(Boolean));
      } catch (err: any) {
        setMessage({ type: 'error', text: err?.detail || 'Failed to load menu mapping.' });
      } finally {
        setSheetLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchSheet();
    getPrepopulateMenuItems()
      .then(setPrepopOptions)
      .catch(() => setPrepopOptions([]));
  }, [fetchSheet]);

  const filteredItems = useMemo(() => applyColumnFilters(items, filters), [items, filters]);
  const paginated = useMemo(
    () => filteredItems.slice(page * rowsPerPage, (page + 1) * rowsPerPage),
    [filteredItems, page, rowsPerPage]
  );

  const unmappedCount = useMemo(() => items.filter((i) => !i.is_mapped).length, [items]);

  const fetchRecipe = async (menuItem: string) => {
    setSelectedItem(menuItem);
    setLoading(true);
    try {
      const data = await getRecipeMappingDetails(menuItem);
      if (!data.rows.length) {
        const pre = await getPrepopulateRecipe(menuItem);
        if (pre.length) {
          setRecipeRows(
            pre.map((r) => ({
              ingredient: r.ingredient,
              type1: r.variant,
              subvariant: r.subvariant,
              type2: r.storage,
              form: r.form,
              origin_id: r.origin_id || 'bought',
              quantity: r.quantity,
              unit: r.unit,
            }))
          );
          setMessage({
            type: 'info',
            text: 'Pre-populated from standard recipe. Review and Save to confirm.',
          });
        } else {
          setRecipeRows([]);
        }
      } else {
        setRecipeRows(
          data.rows.map((r) => ({
            ingredient: r.ingredient,
            type1: r.type1,
            subvariant: r.subvariant,
            type2: r.type2,
            form: r.form,
            origin_id: r.origin_id || 'bought',
            quantity: r.quantity,
            unit: r.unit,
          }))
        );
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.detail || 'Failed to load recipe.' });
    } finally {
      setLoading(false);
    }
  };

  const handleRowChange = (idx: number, field: keyof EditableRow, value: any) =>
    setRecipeRows((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });

  const handleAddRow = () =>
    setRecipeRows((prev) => [
      ...prev,
      {
        ingredient: '',
        type1: '',
        subvariant: '',
        type2: '',
        form: '',
        origin_id: 'bought',
        quantity: 0,
        unit: '',
      },
    ]);

  const handleRemoveRow = (idx: number) =>
    setRecipeRows((prev) => prev.filter((_, i) => i !== idx));

  const handleSave = async () => {
    if (!selectedItem) return;
    const valid = recipeRows.filter((r) => r.ingredient.trim() && r.quantity > 0);
    if (!valid.length) {
      setMessage({ type: 'error', text: 'Add at least one valid ingredient row.' });
      return;
    }
    setLoading(true);
    try {
      await saveRecipeMapping(
        selectedItem,
        valid.map((r) => ({
          ingredient: r.ingredient,
          quantity: r.quantity,
          unit: r.unit,
          type1: r.type1,
          subvariant: r.subvariant,
          type2: r.type2,
          form: r.form,
          origin_id: r.origin_id,
        }))
      );
      setMessage({ type: 'success', text: 'Recipe mapping saved.' });
      fetchSheet(search);
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.detail || 'Save failed.' });
    } finally {
      setLoading(false);
    }
  };

  const handleRecalculate = async () => {
    setRecalcLoading(true);
    try {
      await recompute();
      setMessage({ type: 'success', text: 'Recompute complete.' });
      fetchSheet(search);
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.detail || 'Recompute failed.' });
    } finally {
      setRecalcLoading(false);
    }
  };

  const handleAddMenuItem = async () => {
    if (!newMenuName.trim()) return;
    setAddingMenu(true);
    try {
      // Create a 'Made in-house' ingredient with the same name.
      // The backend _sync_made_ingredient_menu_items (triggered via recompute)
      // will create the corresponding menu item.
      await addIngredient({
        ingredient: newMenuName,
        category: 'Made in-house',
        variant: 'Regular',
        storage: 'Ambient',
        unit: 'each',
        quantity: 0,
        origin_id: 'made',
      } as any);
      
      await recompute();
      
      setMessage({ type: 'success', text: `Menu item "${newMenuName}" created.` });
      setOpenAddMenu(false);
      setNewMenuName('');
      fetchSheet();
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.detail || 'Failed to create menu item.' });
    } finally {
      setAddingMenu(false);
    }
  };

  const prepopApply = async (menuItem: string) => {
    setPrepopAnchor(null);
    try {
      const pre = await getPrepopulateRecipe(menuItem);
      setRecipeRows(
        pre.map((r) => ({
          ingredient: r.ingredient,
          type1: r.variant,
          subvariant: r.subvariant,
          type2: r.storage,
          form: r.form,
          origin_id: r.origin_id || 'bought',
          quantity: r.quantity,
          unit: r.unit,
        }))
      );
      setMessage({
        type: 'info',
        text: `Pre-populated from "${menuItem}" standard recipe.`,
      });
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.detail || 'Pre-populate failed.' });
    }
  };

  const filteredPrepop = useMemo(() => {
    if (!prepopSearch.trim()) return prepopOptions;
    const q = prepopSearch.trim().toLowerCase();
    return prepopOptions.filter((p) => p.menu_item.toLowerCase().includes(q));
  }, [prepopOptions, prepopSearch]);

  return (
    <>
      <Head>
        <title> Menu Mapping | Pantrix</title>
      </Head>

      <Container maxWidth={themeStretch ? false : 'xl'}>
        {message && (
          <Alert severity={message.type} onClose={() => setMessage(null)} sx={{ mb: 2 }}>
            {message.text}
          </Alert>
        )}

        <Grid container spacing={3}>
          <Grid item xs={12} md={selectedItem ? 6 : 12}>
            <Card>
              <CardHeader
                title="Menu Mapping"
                subheader={`${items.length} items • ${unmappedCount} still need mapping`}
                action={
                  <Chip
                    label={unmappedCount === 0 ? 'All mapped' : `${unmappedCount} pending`}
                    color={unmappedCount === 0 ? 'success' : 'warning'}
                    size="small"
                  />
                }
              />
              <CardContent>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 2 }}>
                  <TextField
                    size="small"
                    label="Search menu item"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && fetchSheet(search)}
                    sx={{ minWidth: 260 }}
                  />
                  <Button variant="contained" onClick={() => fetchSheet(search)} disabled={sheetLoading}>
                    Apply
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setSearch('');
                      fetchSheet();
                    }}
                  >
                    Clear
                  </Button>
                  <Button variant="outlined" onClick={() => fetchSheet(search)} disabled={sheetLoading}>
                    Refresh
                  </Button>
                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={handleRecalculate}
                    disabled={recalcLoading}
                    startIcon={<Iconify icon="eva:refresh-fill" />}
                  >
                    Recalculate
                  </Button>
                  <Button
                    variant="contained"
                    onClick={() => setOpenAddMenu(true)}
                    startIcon={<Iconify icon="eva:plus-fill" />}
                  >
                    Add Menu Item
                  </Button>
                </Stack>

                {sheetLoading && <LinearProgress sx={{ mb: 1 }} />}

                <TableContainer>
                  <Scrollbar>
                    <Table sx={{ minWidth: 700 }}>
                      <TableHead>
                        <TableRow>
                          <TableCell>
                            <FilterableHeader
                              label="Category"
                              rows={items}
                              field="category"
                              filters={filters}
                              setFilter={setFilter}
                            />
                          </TableCell>
                          <TableCell>
                            <FilterableHeader
                              label="Menu Item"
                              rows={items}
                              field="menu_item"
                              filters={filters}
                              setFilter={setFilter}
                            />
                          </TableCell>
                          <TableCell>Unique ID</TableCell>
                          <TableCell align="right">Mapped rows</TableCell>
                          <TableCell>
                            <FilterableHeader
                              label="Status"
                              rows={items}
                              field="status"
                              filters={filters}
                              setFilter={setFilter}
                            />
                          </TableCell>
                          <TableCell>Action</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {paginated.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={6} align="center">
                              <Typography color="text.secondary">No menu items.</Typography>
                            </TableCell>
                          </TableRow>
                        )}
                        {paginated.map((row) => (
                          <TableRow key={`${row.menu_item}-${row.unique_code}`} hover>
                            <TableCell>{row.category}</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>{row.menu_item}</TableCell>
                            <TableCell>
                              <Typography variant="caption" color="text.secondary">
                                {row.unique_code}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">{row.mapped_rows}</TableCell>
                            <TableCell>
                              <Label color={row.is_mapped ? 'success' : 'warning'}>
                                {row.is_mapped ? 'Mapped' : 'Pending'}
                              </Label>
                            </TableCell>
                            <TableCell>
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={() => fetchRecipe(row.menu_item)}
                              >
                                Open
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Scrollbar>
                </TableContainer>

                <TablePagination
                  component="div"
                  count={filteredItems.length}
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
          </Grid>

          {selectedItem && (
            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader
                  title={`Recipe: ${selectedItem}`}
                  action={
                    <Stack direction="row" spacing={1}>
                      <Button
                        variant="outlined"
                        size="small"
                        color="secondary"
                        onClick={(e) => setPrepopAnchor(e.currentTarget)}
                        startIcon={<Iconify icon="eva:copy-outline" />}
                      >
                        Pre-populate
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={handleAddRow}
                        startIcon={<Iconify icon="eva:plus-fill" />}
                      >
                        Add row
                      </Button>
                      <Button
                        variant="contained"
                        color="success"
                        size="small"
                        onClick={handleSave}
                        disabled={loading}
                      >
                        Save mapping
                      </Button>
                      <Button
                        variant="text"
                        size="small"
                        onClick={() => {
                          setSelectedItem(null);
                          setRecipeRows([]);
                        }}
                      >
                        Close
                      </Button>
                    </Stack>
                  }
                />

                {loading && <LinearProgress />}

                <CardContent>
                  <TableContainer>
                    <Scrollbar>
                      <Table sx={{ minWidth: 900 }}>
                        <TableHead>
                          <TableRow>
                            <TableCell>Ingredient</TableCell>
                            <TableCell>Variant</TableCell>
                            <TableCell>Subvariant</TableCell>
                            <TableCell>Storage</TableCell>
                            <TableCell>Form</TableCell>
                            <TableCell>Origin</TableCell>
                            <TableCell>Quantity</TableCell>
                            <TableCell>Unit</TableCell>
                            <TableCell />
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {recipeRows.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={9} align="center">
                                <Typography variant="body2" color="text.secondary">
                                  No ingredients yet — Add a row or Pre-populate.
                                </Typography>
                              </TableCell>
                            </TableRow>
                          )}
                          {recipeRows.map((row, idx) => (
                            <TableRow key={idx}>
                              <TableCell sx={{ minWidth: 180 }}>
                                <Autocomplete
                                  freeSolo
                                  size="small"
                                  options={ingredientOptions}
                                  value={row.ingredient}
                                  onChange={(_, v) =>
                                    handleRowChange(idx, 'ingredient', v || '')
                                  }
                                  onInputChange={(_, v) => handleRowChange(idx, 'ingredient', v)}
                                  renderInput={(params) => <TextField {...params} />}
                                />
                              </TableCell>
                              <TableCell>
                                <TextField
                                  size="small"
                                  value={row.type1}
                                  onChange={(e) => handleRowChange(idx, 'type1', e.target.value)}
                                  sx={{ width: 120 }}
                                />
                              </TableCell>
                              <TableCell>
                                <TextField
                                  size="small"
                                  value={row.subvariant}
                                  onChange={(e) =>
                                    handleRowChange(idx, 'subvariant', e.target.value)
                                  }
                                  sx={{ width: 120 }}
                                />
                              </TableCell>
                              <TableCell>
                                <TextField
                                  size="small"
                                  value={row.type2}
                                  onChange={(e) => handleRowChange(idx, 'type2', e.target.value)}
                                  sx={{ width: 120 }}
                                />
                              </TableCell>
                              <TableCell>
                                <TextField
                                  size="small"
                                  value={row.form}
                                  onChange={(e) => handleRowChange(idx, 'form', e.target.value)}
                                  sx={{ width: 120 }}
                                />
                              </TableCell>
                              <TableCell>
                                <TextField
                                  size="small"
                                  select
                                  value={row.origin_id}
                                  onChange={(e) =>
                                    handleRowChange(idx, 'origin_id', e.target.value)
                                  }
                                  sx={{ width: 110 }}
                                >
                                  <MenuItem value="bought">Bought</MenuItem>
                                  <MenuItem value="made">Made</MenuItem>
                                </TextField>
                              </TableCell>
                              <TableCell>
                                <TextField
                                  size="small"
                                  type="number"
                                  value={row.quantity}
                                  onChange={(e) =>
                                    handleRowChange(
                                      idx,
                                      'quantity',
                                      parseFloat(e.target.value) || 0
                                    )
                                  }
                                  sx={{ width: 100 }}
                                />
                              </TableCell>
                              <TableCell>
                                <TextField
                                  size="small"
                                  value={row.unit}
                                  onChange={(e) => handleRowChange(idx, 'unit', e.target.value)}
                                  sx={{ width: 80 }}
                                />
                              </TableCell>
                              <TableCell>
                                <IconButton color="error" onClick={() => handleRemoveRow(idx)}>
                                  <Iconify icon="eva:trash-2-outline" />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </Scrollbar>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>

        <Popover
          open={Boolean(prepopAnchor)}
          anchorEl={prepopAnchor}
          onClose={() => setPrepopAnchor(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        >
          <Stack sx={{ p: 2, width: 320 }} spacing={1}>
            <TextField
              size="small"
              placeholder="Search standard recipes…"
              value={prepopSearch}
              onChange={(e) => setPrepopSearch(e.target.value)}
            />
            <List dense sx={{ maxHeight: 320, overflowY: 'auto' }}>
              {filteredPrepop.length === 0 && (
                <Typography variant="caption" color="text.secondary" sx={{ px: 2 }}>
                  No standard recipes found.
                </Typography>
              )}
              {filteredPrepop.map((p) => (
                <ListItemButton key={p.menu_item} onClick={() => prepopApply(p.menu_item)}>
                  <ListItemText
                    primary={p.menu_item}
                    secondary={
                      <>
                        {p.is_std && <Chip label="Standard" size="small" sx={{ mr: 0.5 }} />}
                        {p.is_existing && <Chip label="Existing" size="small" />}
                      </>
                    }
                  />
                </ListItemButton>
              ))}
            </List>
          </Stack>
        </Popover>

        <Dialog open={openAddMenu} onClose={() => !addingMenu && setOpenAddMenu(false)} fullWidth maxWidth="xs">
          <DialogTitle>Add Menu Item</DialogTitle>
          <DialogContent sx={{ pt: 1 }}>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Create a brand-new menu item. This will automatically create a corresponding &quot;Made in-house&quot; ingredient.
            </Typography>
            <TextField
              fullWidth
              autoFocus
              label="Menu Item Name"
              value={newMenuName}
              onChange={(e) => setNewMenuName(e.target.value)}
              disabled={addingMenu}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenAddMenu(false)} disabled={addingMenu}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleAddMenuItem}
              disabled={!newMenuName.trim() || addingMenu}
            >
              Create
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </>
  );
}

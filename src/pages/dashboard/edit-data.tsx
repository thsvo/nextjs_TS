/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback, useMemo } from 'react';
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
  TableHead,
  TablePagination,
  Button,
  TextField,
  Alert,
  Stack,
  LinearProgress,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  IconButton,
} from '@mui/material';
import DashboardLayout from '../../layouts/dashboard';
import { useSettingsContext } from '../../components/settings';
import Scrollbar from '../../components/scrollbar';
import Iconify from '../../components/iconify';
import {
  getEditRestocks,
  editRestock,
  editRestockRemoveItem,
  editRestockUndoRemoveItem,
  getEditPortioningRecords,
  editPortioningRecord,
  editPortioningRecordRemove,
  getEditUploadFiles,
  deleteUploadFile,
  EditRestockRow,
  UploadedFile,
} from '../../api/pantrix';

type Mode = 'base' | 'portioned';

EditDataPage.getLayout = (page: React.ReactElement) => (
  <DashboardLayout>{page}</DashboardLayout>
);

export default function EditDataPage() {
  const { themeStretch } = useSettingsContext();
  const [mode, setMode] = useState<Mode>('base');

  // Restock section state
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [restocks, setRestocks] = useState<EditRestockRow[]>([]);
  const [edits, setEdits] = useState<Record<number, { qty?: string; cost?: string }>>({});
  const [restockLoading, setRestockLoading] = useState(false);
  const [restockMsg, setRestockMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );
  const [restockPage, setRestockPage] = useState(0);
  const [restockPerPage, setRestockPerPage] = useState(25);

  // Uploaded files
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [filesMsg, setFilesMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  // Portioning records
  const [portRecords, setPortRecords] = useState<any[]>([]);
  const [portEdits, setPortEdits] = useState<Record<number, string>>({});
  const [portMsg, setPortMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [portPage, setPortPage] = useState(0);
  const [portPerPage, setPortPerPage] = useState(25);

  const fetchRestocks = useCallback(async () => {
    setRestockLoading(true);
    try {
      const params =
        fromDate && toDate
          ? { date_from: fromDate, date_to: toDate }
          : { days: 7 };
      const data = await getEditRestocks(params);
      setRestocks(data.restocks || []);
      if (!fromDate) setFromDate(data.start_date);
      if (!toDate) setToDate(data.end_date);
      setEdits({});
    } catch (err: any) {
      setRestockMsg({ type: 'error', text: err?.detail || 'Failed to load restocks.' });
    } finally {
      setRestockLoading(false);
    }
  }, [fromDate, toDate]);

  const fetchFiles = useCallback(async () => {
    try {
      const data = await getEditUploadFiles(14);
      setFiles(data.files || []);
    } catch (err: any) {
      setFilesMsg({ type: 'error', text: err?.detail || 'Failed to load files.' });
    }
  }, []);

  const fetchPortRecords = useCallback(async () => {
    try {
      setPortRecords(await getEditPortioningRecords());
      setPortEdits({});
    } catch (err: any) {
      setPortMsg({ type: 'error', text: err?.detail || 'Failed to load portioning records.' });
    }
  }, []);

  useEffect(() => {
    if (mode === 'base') {
      fetchRestocks();
      fetchFiles();
    } else {
      fetchPortRecords();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const restockPaginated = useMemo(
    () => restocks.slice(restockPage * restockPerPage, (restockPage + 1) * restockPerPage),
    [restocks, restockPage, restockPerPage]
  );
  const portPaginated = useMemo(
    () => portRecords.slice(portPage * portPerPage, (portPage + 1) * portPerPage),
    [portRecords, portPage, portPerPage]
  );

  const handleSaveRestock = async (row: EditRestockRow) => {
    const edit = edits[row.id] || {};
    const newQty = edit.qty !== undefined ? parseFloat(edit.qty) : row.quantity;
    const newCost = edit.cost !== undefined ? parseFloat(edit.cost) : row.total_cost;
    try {
      await editRestock(row.id, newQty, newCost);
      setRestockMsg({ type: 'success', text: `Updated ${row.ingredient}.` });
      fetchRestocks();
    } catch (err: any) {
      setRestockMsg({ type: 'error', text: err?.detail || 'Save failed.' });
    }
  };

  const handleRemoveRestock = async (row: EditRestockRow) => {
    if (!window.confirm(`Remove restock #${row.id} for ${row.ingredient}?`)) return;
    try {
      await editRestockRemoveItem(row.id);
      setRestockMsg({ type: 'success', text: `Removed restock #${row.id}.` });
      fetchRestocks();
    } catch (err: any) {
      setRestockMsg({ type: 'error', text: err?.detail || 'Remove failed.' });
    }
  };

  const handleUndoRemove = async (undoId: number) => {
    try {
      await editRestockUndoRemoveItem(undoId);
      setRestockMsg({ type: 'success', text: 'Removal undone.' });
      fetchRestocks();
    } catch (err: any) {
      setRestockMsg({ type: 'error', text: err?.detail || 'Undo failed.' });
    }
  };

  const handleDeleteFile = async (f: UploadedFile) => {
    if (
      !window.confirm(
        `Delete import "${f.file_name}"? This removes all associated data rows.`
      )
    )
      return;
    try {
      await deleteUploadFile(f.id);
      setFilesMsg({ type: 'success', text: `Deleted "${f.file_name}".` });
      fetchFiles();
      fetchRestocks();
    } catch (err: any) {
      setFilesMsg({ type: 'error', text: err?.detail || 'Delete failed.' });
    }
  };

  const handleSavePort = async (row: any) => {
    const value = portEdits[row.id];
    if (value === undefined) return;
    try {
      await editPortioningRecord(row.id, parseFloat(value) || 0);
      setPortMsg({ type: 'success', text: 'Portioning record updated.' });
      fetchPortRecords();
    } catch (err: any) {
      setPortMsg({ type: 'error', text: err?.detail || 'Save failed.' });
    }
  };

  const handleRemovePort = async (row: any) => {
    if (!window.confirm(`Remove portioning record #${row.id}?`)) return;
    try {
      await editPortioningRecordRemove(row.id);
      setPortMsg({ type: 'success', text: `Removed portioning record #${row.id}.` });
      fetchPortRecords();
    } catch (err: any) {
      setPortMsg({ type: 'error', text: err?.detail || 'Remove failed.' });
    }
  };

  return (
    <>
      <Head>
        <title> Edit Data | Pantrix</title>
      </Head>

      <Container maxWidth={themeStretch ? false : 'xl'}>
        <Card sx={{ mb: 3 }}>
          <CardHeader
            title="Edit data"
            subheader="Correct past restocks and uploaded files, or remove entries"
            action={
              <ToggleButtonGroup
                exclusive
                size="small"
                value={mode}
                onChange={(_, v) => v && setMode(v)}
              >
                <ToggleButton value="base">Base ingredients</ToggleButton>
                <ToggleButton value="portioned">Portioned items</ToggleButton>
              </ToggleButtonGroup>
            }
          />
          <CardContent>
            {mode === 'base' ? (
              <>
                {restockMsg && (
                  <Alert
                    severity={restockMsg.type}
                    onClose={() => setRestockMsg(null)}
                    sx={{ mb: 2 }}
                  >
                    {restockMsg.text}
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
                    type="date"
                    label="From"
                    InputLabelProps={{ shrink: true }}
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                  />
                  <TextField
                    size="small"
                    type="date"
                    label="To"
                    InputLabelProps={{ shrink: true }}
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                  />
                  <Button variant="contained" onClick={fetchRestocks} disabled={restockLoading}>
                    Apply
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setFromDate('');
                      setToDate('');
                      fetchRestocks();
                    }}
                  >
                    Reset (last 7 days)
                  </Button>
                </Stack>

                {restockLoading && <LinearProgress sx={{ mb: 1 }} />}

                <TableContainer>
                  <Scrollbar>
                    <Table sx={{ minWidth: 1000 }}>
                      <TableHead>
                        <TableRow>
                          <TableCell>Date loaded</TableCell>
                          <TableCell>Ingredient</TableCell>
                          <TableCell>Unit</TableCell>
                          <TableCell>Quantity</TableCell>
                          <TableCell>Cost (R)</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {restockPaginated.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={7} align="center">
                              <Typography color="text.secondary">No restocks.</Typography>
                            </TableCell>
                          </TableRow>
                        )}
                        {restockPaginated.map((r) => {
                          const edit = edits[r.id] || {};
                          return (
                            <TableRow key={r.id} hover>
                              <TableCell>{r.date}</TableCell>
                              <TableCell sx={{ fontWeight: 'bold' }}>{r.ingredient}</TableCell>
                              <TableCell>{r.unit}</TableCell>
                              <TableCell>
                                <TextField
                                  size="small"
                                  type="number"
                                  value={edit.qty ?? String(r.quantity)}
                                  onChange={(e) =>
                                    setEdits({
                                      ...edits,
                                      [r.id]: { ...edit, qty: e.target.value },
                                    })
                                  }
                                  sx={{ width: 110 }}
                                />
                              </TableCell>
                              <TableCell>
                                <TextField
                                  size="small"
                                  type="number"
                                  value={edit.cost ?? String(r.total_cost)}
                                  onChange={(e) =>
                                    setEdits({
                                      ...edits,
                                      [r.id]: { ...edit, cost: e.target.value },
                                    })
                                  }
                                  sx={{ width: 110 }}
                                />
                              </TableCell>
                              <TableCell>
                                {r.pending_remove ? (
                                  <Typography variant="caption" color="warning.main">
                                    Pending remove
                                  </Typography>
                                ) : (
                                  <Typography variant="caption" color="success.main">
                                    Active
                                  </Typography>
                                )}
                              </TableCell>
                              <TableCell>
                                <Stack direction="row" spacing={1}>
                                  <Button size="small" variant="contained" onClick={() => handleSaveRestock(r)}>
                                    Save
                                  </Button>
                                  {r.pending_remove && r.undo_id ? (
                                    <Button
                                      size="small"
                                      variant="outlined"
                                      color="warning"
                                      onClick={() => handleUndoRemove(r.undo_id!)}
                                    >
                                      Undo
                                    </Button>
                                  ) : (
                                    <IconButton
                                      size="small"
                                      color="error"
                                      onClick={() => handleRemoveRestock(r)}
                                    >
                                      <Iconify icon="eva:trash-2-outline" width={18} />
                                    </IconButton>
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

                <TablePagination
                  component="div"
                  count={restocks.length}
                  page={restockPage}
                  onPageChange={(_, p) => setRestockPage(p)}
                  rowsPerPage={restockPerPage}
                  onRowsPerPageChange={(e) => {
                    setRestockPerPage(parseInt(e.target.value, 10));
                    setRestockPage(0);
                  }}
                  rowsPerPageOptions={[10, 25, 50, 100]}
                />
              </>
            ) : (
              <>
                {portMsg && (
                  <Alert severity={portMsg.type} onClose={() => setPortMsg(null)} sx={{ mb: 2 }}>
                    {portMsg.text}
                  </Alert>
                )}
                <TableContainer>
                  <Scrollbar>
                    <Table sx={{ minWidth: 1100 }}>
                      <TableHead>
                        <TableRow>
                          <TableCell>Date</TableCell>
                          <TableCell>Ingredient</TableCell>
                          <TableCell>Variant</TableCell>
                          <TableCell>Storage</TableCell>
                          <TableCell>Form</TableCell>
                          <TableCell>Portion size</TableCell>
                          <TableCell>Unit</TableCell>
                          <TableCell>Portions added</TableCell>
                          <TableCell>Current balance</TableCell>
                          <TableCell>Action</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {portPaginated.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={10} align="center">
                              <Typography color="text.secondary">
                                No portioning records.
                              </Typography>
                            </TableCell>
                          </TableRow>
                        )}
                        {portPaginated.map((r) => {
                          const draft = portEdits[r.id];
                          return (
                            <TableRow key={r.id} hover>
                              <TableCell>{r.date}</TableCell>
                              <TableCell sx={{ fontWeight: 'bold' }}>{r.ingredient}</TableCell>
                              <TableCell>{r.variant}</TableCell>
                              <TableCell>{r.storage}</TableCell>
                              <TableCell>{r.form}</TableCell>
                              <TableCell>
                                {r.portion_size} {r.portion_unit}
                              </TableCell>
                              <TableCell>{r.unit}</TableCell>
                              <TableCell>
                                <TextField
                                  size="small"
                                  type="number"
                                  value={draft ?? String(r.quantity ?? r.portions_added ?? 0)}
                                  onChange={(e) =>
                                    setPortEdits({ ...portEdits, [r.id]: e.target.value })
                                  }
                                  sx={{ width: 110 }}
                                />
                              </TableCell>
                              <TableCell>{r.current_balance}</TableCell>
                              <TableCell>
                                <Stack direction="row" spacing={1}>
                                  <Button
                                    size="small"
                                    variant="contained"
                                    disabled={draft === undefined}
                                    onClick={() => handleSavePort(r)}
                                  >
                                    Save
                                  </Button>
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => handleRemovePort(r)}
                                  >
                                    <Iconify icon="eva:trash-2-outline" width={18} />
                                  </IconButton>
                                </Stack>
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
                  count={portRecords.length}
                  page={portPage}
                  onPageChange={(_, p) => setPortPage(p)}
                  rowsPerPage={portPerPage}
                  onRowsPerPageChange={(e) => {
                    setPortPerPage(parseInt(e.target.value, 10));
                    setPortPage(0);
                  }}
                  rowsPerPageOptions={[10, 25, 50, 100]}
                />
              </>
            )}
          </CardContent>
        </Card>

        {mode === 'base' && (
          <Card>
            <CardHeader
              title="Uploaded files (past 14 days)"
              subheader="Removing a file reverses its effect on the inventory"
            />
            <CardContent>
              {filesMsg && (
                <Alert severity={filesMsg.type} onClose={() => setFilesMsg(null)} sx={{ mb: 2 }}>
                  {filesMsg.text}
                </Alert>
              )}

              <TableContainer>
                <Scrollbar>
                  <Table sx={{ minWidth: 900 }}>
                    <TableHead>
                      <TableRow>
                        <TableCell>Date loaded</TableCell>
                        <TableCell>File type</TableCell>
                        <TableCell>File name</TableCell>
                        <TableCell align="right">Rows loaded</TableCell>
                        <TableCell>Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {files.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} align="center">
                            <Typography color="text.secondary">No files in the last 14 days.</Typography>
                          </TableCell>
                        </TableRow>
                      )}
                      {files.map((f) => (
                        <TableRow key={f.id} hover>
                          <TableCell>{f.date}</TableCell>
                          <TableCell>{f.file_type}</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>{f.file_name}</TableCell>
                          <TableCell align="right">{f.rows}</TableCell>
                          <TableCell>
                            <Button
                              size="small"
                              variant="outlined"
                              color="error"
                              onClick={() => handleDeleteFile(f)}
                            >
                              Remove file
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Scrollbar>
              </TableContainer>
            </CardContent>
          </Card>
        )}
      </Container>
    </>
  );
}

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import {
  Container,
  Grid,
  Card,
  CardHeader,
  CardContent,
  Button,
  Stack,
  Typography,
  Box,
  TextField,
  Autocomplete,
  Alert,
  LinearProgress,
} from '@mui/material';
import DashboardLayout from '../../layouts/dashboard';
import axios from '../../utils/axios';
import { useSettingsContext } from '../../components/settings';
import Iconify from '../../components/iconify';
import { getMenuItems, posManual } from '../../api/pantrix';

UploadDataPage.getLayout = (page: React.ReactElement) => (
  <DashboardLayout>{page}</DashboardLayout>
);

type UploadCardProps = {
  title: string;
  description: string;
  endpoint: string;
  accept: string;
};

function UploadCard({ title, description, endpoint, accept }: UploadCardProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setStatus(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await axios.post(endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setStatus({ type: 'success', text: res.data?.message || 'Upload complete.' });
      setFile(null);
      if (inputRef.current) inputRef.current.value = '';
    } catch (err: any) {
      setStatus({
        type: 'error',
        text: err?.response?.data?.detail || 'Upload failed.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card sx={{ height: '100%' }}>
      <CardHeader title={title} subheader={description} />
      <CardContent>
        {status && (
          <Alert severity={status.type} onClose={() => setStatus(null)} sx={{ mb: 2 }}>
            {status.text}
          </Alert>
        )}
        <Box
          sx={{
            p: 3,
            border: '2px dashed',
            borderColor: file ? 'primary.main' : 'divider',
            borderRadius: 1,
            textAlign: 'center',
            bgcolor: 'background.neutral',
            cursor: 'pointer',
          }}
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            accept={accept}
            style={{ display: 'none' }}
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
          <Iconify
            icon="eva:cloud-upload-outline"
            width={40}
            sx={{ color: file ? 'primary.main' : 'text.disabled' }}
          />
          <Typography variant="body2" sx={{ mt: 1 }}>
            {file ? file.name : 'Click to select file or drag and drop'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Supported: {accept}
          </Typography>
        </Box>

        {loading && <LinearProgress sx={{ mt: 2 }} />}

        <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
          <Button
            variant="contained"
            disabled={!file || loading}
            onClick={handleUpload}
            fullWidth
          >
            Upload file
          </Button>
          {file && (
            <Button
              variant="outlined"
              onClick={() => {
                setFile(null);
                if (inputRef.current) inputRef.current.value = '';
              }}
            >
              Clear
            </Button>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}

function ManualPosForm() {
  const [options, setOptions] = useState<string[]>([]);
  const [item, setItem] = useState('');
  const [qty, setQty] = useState('1');
  const [status, setStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    getMenuItems()
      .then(setOptions)
      .catch(() => setOptions([]));
  }, []);

  const handleSubmit = async () => {
    if (!item.trim() || !parseInt(qty, 10)) {
      setStatus({ type: 'error', text: 'Item and quantity are required.' });
      return;
    }
    try {
      await posManual({ unique_code: item.trim(), quantity: parseInt(qty, 10) || 1 });
      setStatus({ type: 'success', text: `Added ${qty} × ${item}.` });
      setItem('');
      setQty('1');
    } catch (err: any) {
      setStatus({
        type: 'error',
        text: err?.response?.data?.detail || 'Add failed.',
      });
    }
  };

  return (
    <Card sx={{ mt: 2 }}>
      <CardHeader title="Or enter a POS order manually" />
      <CardContent>
        {status && (
          <Alert severity={status.type} onClose={() => setStatus(null)} sx={{ mb: 2 }}>
            {status.text}
          </Alert>
        )}
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }}>
          <Autocomplete
            freeSolo
            sx={{ minWidth: 260, flex: 1 }}
            options={options}
            value={item}
            onChange={(_, v) => setItem(v || '')}
            onInputChange={(_, v) => setItem(v || '')}
            renderInput={(p) => <TextField {...p} size="small" label="Menu item" />}
          />
          <TextField
            size="small"
            type="number"
            label="Quantity"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            sx={{ width: 120 }}
          />
          <Button variant="contained" onClick={handleSubmit}>
            Add order
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}

export default function UploadDataPage() {
  const { themeStretch } = useSettingsContext();

  return (
    <>
      <Head>
        <title> Upload data | Pantrix</title>
      </Head>

      <Container maxWidth={themeStretch ? false : 'xl'}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <UploadCard
              title="Upload POS data"
              description="CSV or Excel export of sales orders from your POS."
              endpoint="/upload-pos"
              accept=".csv,.xlsx,.xls"
            />
            <ManualPosForm />
          </Grid>
          <Grid item xs={12} md={4}>
            <UploadCard
              title="Upload menu data"
              description="Excel workbook with a Menu sheet (Category, Menu item, Price)."
              endpoint="/upload-menu-data"
              accept=".xlsx,.xls"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <UploadCard
              title="Upload restock data"
              description="Supplier invoices or restock spreadsheets (CSV / Excel)."
              endpoint="/upload-restock"
              accept=".csv,.xlsx,.xls"
            />
          </Grid>
        </Grid>
      </Container>
    </>
  );
}

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef } from 'react';
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
  Alert,
  LinearProgress,
} from '@mui/material';
import DashboardLayout from '../../layouts/dashboard';
import axios from '../../utils/axios';
import { useSettingsContext } from '../../components/settings';
import Iconify from '../../components/iconify';

UploadBackendPage.getLayout = (page: React.ReactElement) => (
  <DashboardLayout>{page}</DashboardLayout>
);

type CardProps = {
  title: string;
  description: string;
  endpoint: string;
  accept: string;
  hint?: string;
};

function UploadCard({ title, description, endpoint, accept, hint }: CardProps) {
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
        {hint && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
            {hint}
          </Typography>
        )}
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
            Upload
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

export default function UploadBackendPage() {
  const { themeStretch } = useSettingsContext();
  return (
    <>
      <Head>
        <title> Upload data — backend | Pantrix</title>
      </Head>
      <Container maxWidth={themeStretch ? false : 'xl'}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <UploadCard
              title="Ingredient data"
              description="Master ingredient workbook with dimension sheets."
              hint="Expected sheets: Category_Ingredient, Category_Variant, Category_Subvariant, Category_Form, Category_Preparation, Preparation_Unit, Unit_Conversion, Unit_Display and legacy Ingredients."
              endpoint="/upload-ingredient-data"
              accept=".xlsx,.xls"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <UploadCard
              title="Standard recipe mapping"
              description="Standard reference recipes used to pre-populate menu mappings."
              hint="Sheet: standard_recipe_mapping — ingredient, variant, subvariant, storage, form, quantity, unit, origin_id."
              endpoint="/upload-standard-recipe-mapping"
              accept=".xlsx,.xls"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <UploadCard
              title="Menu recipe mapping"
              description="Menu-specific recipe mapping (bulk)."
              hint="Upload a workbook with menu-item → ingredient mappings to bulk-load recipe_mapping."
              endpoint="/upload-menu-recipe-data"
              accept=".xlsx,.xls"
            />
          </Grid>
        </Grid>
      </Container>
    </>
  );
}

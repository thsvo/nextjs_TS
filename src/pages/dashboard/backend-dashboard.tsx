/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import { useTheme, alpha } from '@mui/material/styles';
import {
  Container,
  Grid,
  Button,
  Box,
  Card,
  CardHeader,
  CardContent,
  Stack,
  Typography,
  Alert,
  Checkbox,
  FormControlLabel,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  LinearProgress,
} from '@mui/material';
import { m } from 'framer-motion';
import { useAuthContext } from '../../auth/useAuthContext';
import DashboardLayout from '../../layouts/dashboard';
import { _appFeatured } from '../../_mock/arrays';
import { useSettingsContext } from '../../components/settings';
import GlassCard from '../../components/glass/GlassCard';
import Scrollbar from '../../components/scrollbar';
import {
  AppWelcome,
  AppFeatured,
  AppAreaInstalled,
  AppWidgetSummary,
  AppCurrentDownload,
} from '../../sections/@dashboard/general/app';
import {
  getBackendSummary,
  getBackendTrends,
  getClientPageSettings,
  saveClientPageSettings,
  resetRestocks,
  resetPosOrders,
  BackendSummary,
  BackendTrendPoint,
} from '../../api/pantrix';

const varFadeInUp = {
  initial: { y: 20, opacity: 0 },
  animate: { y: 0, opacity: 1, transition: { duration: 0.5, ease: 'easeOut' } },
};
const varStaggerContainer = {
  animate: { transition: { staggerChildren: 0.1 } },
};

GeneralAppPage.getLayout = (page: React.ReactElement) => (
  <DashboardLayout>{page}</DashboardLayout>
);

function formatBytes(n: number) {
  if (!n) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  let v = n;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i += 1;
  }
  return `${v.toFixed(2)} ${units[i]}`;
}

export default function GeneralAppPage() {
  const { user } = useAuthContext();
  const theme = useTheme();
  const { themeStretch } = useSettingsContext();

  const [summary, setSummary] = useState<BackendSummary | null>(null);
  const [trends, setTrends] = useState<BackendTrendPoint[]>([]);
  const [loading, setLoading] = useState(false);

  const [clientPages, setClientPages] = useState<string[]>([]);
  const [configurable, setConfigurable] = useState<{ id: string; label: string }[]>([]);
  const [clientMsg, setClientMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );
  const [resetMsg, setResetMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  const isAdmin = (user as any)?.role === 'admin';

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [s, t] = await Promise.all([
        getBackendSummary().catch(() => null),
        getBackendTrends(14).catch(() => ({ days: 14, series: [] as BackendTrendPoint[] })),
      ]);
      if (s) setSummary(s);
      setTrends(t.series || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const iv = setInterval(fetchAll, 60000);
    return () => clearInterval(iv);
  }, [fetchAll]);

  useEffect(() => {
    if (!isAdmin) return;
    getClientPageSettings()
      .then((s) => {
        setClientPages(s.pages || []);
        setConfigurable(
          (s.configurable_pages || []).map((id, idx) => ({
            id,
            label: s.configurable_labels?.[idx] || id,
          }))
        );
      })
      .catch(() => {});
  }, [isAdmin]);

  const togglePage = (id: string) => {
    setClientPages((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  };

  const saveClientPages = async () => {
    try {
      await saveClientPageSettings(clientPages);
      setClientMsg({ type: 'success', text: 'Client visibility saved.' });
    } catch (err: any) {
      setClientMsg({ type: 'error', text: err?.detail || 'Save failed.' });
    }
  };

  const handleReset = async (what: 'restocks' | 'pos') => {
    if (
      !window.confirm(
        `Are you sure you want to clear all ${what === 'pos' ? 'POS orders' : 'restocks'}? This cannot be undone.`
      )
    )
      return;
    try {
      if (what === 'pos') await resetPosOrders();
      else await resetRestocks();
      setResetMsg({ type: 'success', text: `Reset ${what} complete.` });
      fetchAll();
    } catch (err: any) {
      setResetMsg({ type: 'error', text: err?.detail || 'Reset failed.' });
    }
  };

  const chartData = {
    categories: trends.map((item: any) => item.date),
    series: [
      {
        year: 'Current',
        data: [
          { name: 'POS Orders', data: trends.map((item: any) => item.pos_orders) },
          { name: 'Restocks', data: trends.map((item: any) => item.restocks) },
        ],
      },
    ],
  };

  return (
    <>
      <Head>
        <title> Pantrix: Backend Dashboard | Minimal UI</title>
      </Head>

      <Container maxWidth={themeStretch ? false : 'xl'}>
        <m.div initial="initial" animate="animate" variants={varStaggerContainer}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={8} component={m.div} variants={varFadeInUp}>
              <AppWelcome
                title={`Welcome back, \n ${user?.displayName || 'there'}`}
                description={
                  summary
                    ? `${summary.counts?.ingredients ?? 0} ingredients • ${
                        summary.counts?.menu_items ?? 0
                      } menu items • last POS ${
                        summary.latest_dates?.pos_orders || '—'
                      }.`
                    : 'Your AI-powered inventory hub.'
                }
                img={
                  <Box
                    component="img"
                    src="/assets/illustrations/illustration_dashboard.png"
                    sx={{
                      p: 3,
                      width: 360,
                      filter: 'drop-shadow(0 12px 24px rgba(0,0,0,0.2))',
                      margin: { xs: 'auto', md: 'inherit' },
                    }}
                  />
                }
                action={
                  <Button variant="contained" color="primary" size="large" onClick={fetchAll}>
                    Refresh
                  </Button>
                }
                sx={{
                  background: `linear-gradient(135deg, ${alpha(
                    theme.palette.primary.light,
                    0.2
                  )} 0%, ${alpha(theme.palette.primary.main, 0.2)} 100%)`,
                  backdropFilter: 'blur(10px)',
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                }}
              />
            </Grid>
            <Grid item xs={12} md={4} component={m.div} variants={varFadeInUp}>
              <AppFeatured list={_appFeatured} />
            </Grid>

            <Grid item xs={12} md={4} component={m.div} variants={varFadeInUp}>
              <AppWidgetSummary
                title="POS Orders (7d)"
                percent={0}
                total={summary?.recent_7d?.pos_orders || 0}
                color="primary"
                chart={{
                  colors: [theme.palette.primary.main],
                  series: trends.map((item: any) => item.pos_orders).slice(-10),
                }}
              />
            </Grid>
            <Grid item xs={12} md={4} component={m.div} variants={varFadeInUp}>
              <AppWidgetSummary
                title="Restocks (7d)"
                percent={0}
                total={summary?.recent_7d?.restocks || 0}
                color="info"
                chart={{
                  colors: [theme.palette.info.main],
                  series: trends.map((item: any) => item.restocks).slice(-10),
                }}
              />
            </Grid>
            <Grid item xs={12} md={4} component={m.div} variants={varFadeInUp}>
              <AppWidgetSummary
                title="Critical Alerts"
                percent={0}
                total={summary?.counts?.low_stock_alerts || 0}
                color="error"
                chart={{
                  colors: [theme.palette.error.main],
                  series: [8, 9, 31, 8, 16, 37, 8, 33, 46, 31],
                }}
              />
            </Grid>

            <Grid item xs={12} md={6} lg={4} component={m.div} variants={varFadeInUp}>
              <GlassCard sx={{ p: 3 }}>
                <AppCurrentDownload
                  title="System Composition"
                  chart={{
                    colors: [
                      theme.palette.primary.main,
                      theme.palette.info.main,
                      theme.palette.error.main,
                      theme.palette.warning.main,
                    ],
                    series: [
                      { label: 'Ingredients', value: summary?.counts?.ingredients || 0 },
                      { label: 'Menu Items', value: summary?.counts?.menu_items || 0 },
                      { label: 'Recipes', value: summary?.counts?.recipe_mappings || 0 },
                    ],
                  }}
                />
              </GlassCard>
            </Grid>
            <Grid item xs={12} md={6} lg={8} component={m.div} variants={varFadeInUp}>
              <GlassCard sx={{ p: 0 }}>
                <AppAreaInstalled
                  title="Operational Velocity"
                  subheader="POS Orders vs Restock Frequency"
                  chart={chartData}
                />
              </GlassCard>
            </Grid>

            <Grid item xs={12} component={m.div} variants={varFadeInUp}>
              <Card>
                <CardHeader
                  title="Data summary"
                  subheader={summary?.generated_at ? `Updated ${summary.generated_at}` : undefined}
                  action={
                    <Button variant="outlined" size="small" onClick={fetchAll} disabled={loading}>
                      Refresh
                    </Button>
                  }
                />
                {loading && <LinearProgress />}
                <CardContent>
                  <Grid container spacing={2}>
                    {[
                      ['Ingredients', summary?.counts?.ingredients],
                      ['Menu items', summary?.counts?.menu_items],
                      ['Recipe mappings', summary?.counts?.recipe_mappings],
                      ['POS orders', summary?.counts?.pos_orders],
                      ['Restocks', summary?.counts?.restocks],
                      ['Daily balances', summary?.counts?.daily_balances],
                      ['Inventory levels', summary?.counts?.inventory_levels],
                      ['Missing cost restocks', summary?.counts?.missing_cost_restocks],
                      ['Low stock alerts', summary?.counts?.low_stock_alerts],
                      ['Latest POS', summary?.latest_dates?.pos_orders],
                      ['Latest restock', summary?.latest_dates?.restocks],
                      [
                        'DB size',
                        summary?.database?.size_bytes
                          ? formatBytes(summary.database.size_bytes as number)
                          : '—',
                      ],
                    ].map(([label, value]) => (
                      <Grid item xs={6} md={3} key={String(label)}>
                        <Typography variant="caption" color="text.secondary">
                          {label}
                        </Typography>
                        <Typography variant="h5">{value ?? '—'}</Typography>
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} component={m.div} variants={varFadeInUp}>
              <Card>
                <CardHeader title="Trends — last 14 days" />
                <CardContent>
                  <TableContainer>
                    <Scrollbar>
                      <Table sx={{ minWidth: 900 }}>
                        <TableHead>
                          <TableRow>
                            <TableCell>Date</TableCell>
                            <TableCell align="right">POS orders</TableCell>
                            <TableCell align="right">Restocks</TableCell>
                            <TableCell align="right">Restocked quantity</TableCell>
                            <TableCell align="right">Restock cost (R)</TableCell>
                            <TableCell align="right">Missing-cost restocks</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {trends.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={6} align="center">
                                <Typography color="text.secondary">No trends data.</Typography>
                              </TableCell>
                            </TableRow>
                          )}
                          {trends.map((t: any) => (
                            <TableRow key={t.date} hover>
                              <TableCell>{t.date}</TableCell>
                              <TableCell align="right">{t.pos_orders ?? 0}</TableCell>
                              <TableCell align="right">{t.restocks ?? 0}</TableCell>
                              <TableCell align="right">
                                {Number(t.restocked_qty ?? t.restock_qty ?? 0).toFixed(2)}
                              </TableCell>
                              <TableCell align="right">
                                R {Number(t.restock_cost ?? 0).toFixed(2)}
                              </TableCell>
                              <TableCell align="right">
                                {t.missing_cost_restocks ?? 0}
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

            {isAdmin && (
              <>
                <Grid item xs={12} md={6} component={m.div} variants={varFadeInUp}>
                  <Card>
                    <CardHeader
                      title="Client page visibility"
                      subheader="Choose which pages client-role users can see."
                    />
                    <CardContent>
                      {clientMsg && (
                        <Alert
                          severity={clientMsg.type}
                          onClose={() => setClientMsg(null)}
                          sx={{ mb: 2 }}
                        >
                          {clientMsg.text}
                        </Alert>
                      )}
                      <Stack spacing={0.5} sx={{ mb: 2 }}>
                        {configurable.map((p) => (
                          <FormControlLabel
                            key={p.id}
                            control={
                              <Checkbox
                                size="small"
                                checked={clientPages.includes(p.id)}
                                onChange={() => togglePage(p.id)}
                              />
                            }
                            label={p.label}
                          />
                        ))}
                        {configurable.length === 0 && (
                          <Typography variant="caption" color="text.secondary">
                            No configurable pages.
                          </Typography>
                        )}
                      </Stack>
                      <Button variant="contained" onClick={saveClientPages}>
                        Save client pages
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} md={6} component={m.div} variants={varFadeInUp}>
                  <Card>
                    <CardHeader
                      title="Backend reset"
                      subheader="Destructive operations — use with care."
                    />
                    <CardContent>
                      {resetMsg && (
                        <Alert
                          severity={resetMsg.type}
                          onClose={() => setResetMsg(null)}
                          sx={{ mb: 2 }}
                        >
                          {resetMsg.text}
                        </Alert>
                      )}
                      <Stack direction="row" spacing={2}>
                        <Button
                          variant="outlined"
                          color="error"
                          onClick={() => handleReset('restocks')}
                        >
                          Clear restocks
                        </Button>
                        <Button
                          variant="outlined"
                          color="error"
                          onClick={() => handleReset('pos')}
                        >
                          Clear POS orders
                        </Button>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              </>
            )}
          </Grid>
        </m.div>
      </Container>
    </>
  );
}

import { useState, useEffect, useCallback } from 'react';
// next
import Head from 'next/head';
// @mui
import { useTheme } from '@mui/material/styles';
import { Container, Grid, Button } from '@mui/material';
// auth
import { useAuthContext } from '../../auth/useAuthContext';
// layouts
import DashboardLayout from '../../layouts/dashboard';
// axios
import axios from '../../utils/axios';
// _mock_
import {
  _appFeatured,
} from '../../_mock/arrays';
// components
import { useSettingsContext } from '../../components/settings';
// sections
import {
  AppWelcome,
  AppFeatured,
  AppNewInvoice,
  AppAreaInstalled,
  AppWidgetSummary,
  AppCurrentDownload,
  InventoryLevelTable,
  ProfitabilityAnalysisTable,
} from '../../sections/@dashboard/general/app';
// assets
import { SeoIllustration } from '../../assets/illustrations';

// ----------------------------------------------------------------------

GeneralAppPage.getLayout = (page: React.ReactElement) => <DashboardLayout>{page}</DashboardLayout>;

// ----------------------------------------------------------------------

export default function GeneralAppPage() {
  const { user } = useAuthContext();

  const theme = useTheme();

  const { themeStretch } = useSettingsContext();

  const [summary, setSummary] = useState<any>(null);

  const [trends, setTrends] = useState<any>([]);

  const [restocks, setRestocks] = useState<any>([]);

  const [inventory, setInventory] = useState<any>([]);

  const [profitability, setProfitability] = useState<any>([]);

  const fetchData = useCallback(async () => {
    try {
      const [summaryRes, trendsRes, restocksRes, inventoryRes, profitRes] = await Promise.all([
        axios.get('/backend-summary'),
        axios.get('/backend-trends?days=14'),
        axios.get('/edit-restocks?days=7'),
        axios.get('/latest-stock?page_size=100'),
        axios.get('/profitability?page_size=100'),
      ]);
      setSummary(summaryRes.data);
      setTrends(trendsRes.data.series || []);
      setRestocks(restocksRes.data.active_rows || []);
      setInventory(inventoryRes.data.ingredients || []); 
      setProfitability(profitRes.data.items || []);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
        <title> General: App | Minimal UI</title>
      </Head>

      <Container maxWidth={themeStretch ? false : 'xl'}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <AppWelcome
              title={`Welcome back! \n ${user?.displayName}`}
              description="If you are going to use a passage of Lorem Ipsum, you need to be sure there isn't anything."
              img={
                <SeoIllustration
                  sx={{
                    p: 3,
                    width: 360,
                    margin: { xs: 'auto', md: 'inherit' },
                  }}
                />
              }
                            action={
                <Button
                  variant="contained"
                  onClick={async () => {
                    try {
                      await axios.post('/recompute');
                      alert('Recompute triggered successfully.');
                      fetchData();
                    } catch (error) {
                      console.error('Recompute failed:', error);
                      alert('Recompute failed.');
                    }
                  }}
                >
                  Recompute All Stock
                </Button>
              }
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <AppFeatured list={_appFeatured} />
          </Grid>

          <Grid item xs={12} md={4}>
            <AppWidgetSummary
              title="Total Orders (Lifetime)"
              percent={summary?.recent_7d?.pos_orders ? 100 : 0}
              total={summary?.counts?.pos_orders || 0}
              chart={{
                colors: [theme.palette.primary.main],
                series: trends.map((item: any) => item.pos_orders).slice(-10),
              }}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <AppWidgetSummary
              title="Total Ingredients"
              percent={0}
              total={summary?.counts?.ingredients || 0}
              chart={{
                colors: [theme.palette.info.main],
                series: [20, 41, 63, 33, 28, 35, 50, 46, 11, 26], // Keep placeholder for now as we don't have historical ingredient counts
              }}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <AppWidgetSummary
              title="Low Stock Alerts"
              percent={summary?.counts?.low_stock_alerts ? -10 : 0}
              total={summary?.counts?.low_stock_alerts || 0}
              chart={{
                colors: [theme.palette.warning.main],
                series: [8, 9, 31, 8, 16, 37, 8, 33, 46, 31],
              }}
            />
          </Grid>

          <Grid item xs={12} md={6} lg={4}>
            <AppCurrentDownload
              title="Inventory Breakdown"
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
          </Grid>

          <Grid item xs={12} md={6} lg={8}>
            <AppAreaInstalled
              title="Order & Restock Trends"
              subheader="Daily activity for the last 14 days"
              chart={chartData}
            />
          </Grid>

          <Grid item xs={12} lg={12}>
            <InventoryLevelTable
              title="Inventory Levels"
              subheader="Current stock balance and capacity"
              tableData={inventory.map((row: any, index: number) => ({
                id: `inv-${index}`,
                category: row[0],
                ingredient: row[1],
                variant: row[2],
                subvariant: row[3],
                storage: row[4],
                form: row[5],
                balance: row[6],
                percentage_of_full: row[7],
                unit: row[8],
              }))}
              tableLabels={[
                { id: 'ingredient', label: 'Ingredient' },
                { id: 'balance', label: 'Current Balance' },
                { id: 'percentage_of_full', label: '% Full' },
              ]}
            />
          </Grid>

          <Grid item xs={12} lg={12}>
            <ProfitabilityAnalysisTable
              title="Profitability Analysis"
              subheader="Ingredient cost and gross margin per menu item"
              tableData={profitability.map((item: any, index: number) => ({
                id: `profit-${index}`,
                name: item.menu_item,
                category: item.menu_category,
                price: item.menu_price,
                ingredient_cost: item.total_ingredient_cost,
                gross_margin: item.gross_margin,
                orders_past_month: item.orders_past_month,
              }))}
              tableLabels={[
                { id: 'name', label: 'Menu Item' },
                { id: 'ingredient_cost', label: 'Ingredient Cost' },
                { id: 'gross_margin', label: 'Gross Margin' },
                { id: 'orders_past_month', label: 'Orders (Past Month)', align: 'center' },
              ]}
            />
          </Grid>

          <Grid item xs={12} lg={12}>
            <AppNewInvoice
              title="Recent Restocks"
              tableData={restocks.map((row: any) => ({
                id: row.id,
                category: row.ingredient,
                price: row.total_cost,
                status: row.total_cost > 0 ? 'paid' : 'out_of_date', // Mapping cost to status for demo
                invoiceNumber: `RES-${row.id}`,
              }))}
              tableLabels={[
                { id: 'invoiceNumber', label: 'Restock ID' },
                { id: 'category', label: 'Ingredient' },
                { id: 'price', label: 'Total Cost' },
                { id: 'status', label: 'Status' },
                { id: '' },
              ]}
            />
          </Grid>
        </Grid>
      </Container>
    </>
  );
}

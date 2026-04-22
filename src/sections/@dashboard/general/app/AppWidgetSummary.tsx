import { ApexOptions } from 'apexcharts';
// @mui
import { alpha, useTheme } from '@mui/material/styles';
import { Box, Typography, Stack, CardProps } from '@mui/material';
// utils
import { fNumber, fPercent } from '../../../../utils/formatNumber';
// components
import GlassCard from '../../../../components/glass/GlassCard';
import Iconify from '../../../../components/iconify';
import Chart from '../../../../components/chart';

// ----------------------------------------------------------------------

interface Props extends CardProps {
  title: string;
  total: number;
  percent: number;
  color?: 'primary' | 'info' | 'success' | 'warning' | 'error';
  chart: {
    colors?: string[];
    series: number[];
    options?: ApexOptions;
  };
}

export default function AppWidgetSummary({ title, percent, total, chart, color = 'primary', sx, ...other }: Props) {
  const theme = useTheme();
  const { colors, series, options } = chart;

  const chartOptions = {
    colors,
    chart: {
      sparkline: {
        enabled: true,
      },
    },
    plotOptions: {
      bar: {
        columnWidth: '68%',
        borderRadius: 2,
      },
    },
    tooltip: {
      x: { show: false },
      y: {
        formatter: (value: number) => fNumber(value),
        title: {
          formatter: () => '',
        },
      },
      marker: { show: false },
    },
    ...options,
  };

  return (
    <GlassCard 
      sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        p: 3, 
        position: 'relative',
        overflow: 'hidden',
        ...sx 
      }} 
      {...other}
    >
      <Box
        sx={{
          width: 80,
          height: 80,
          opacity: 0.12,
          position: 'absolute',
          right: -16,
          top: -16,
          borderRadius: '50%',
          bgcolor: theme.palette[color].main,
          filter: 'blur(20px)',
        }}
      />
      
      <Box sx={{ flexGrow: 1 }}>
        <Typography variant="subtitle2" sx={{ opacity: 0.72 }}>{title}</Typography>

        <TrendingInfo percent={percent} />

        <Typography variant="h3">{fNumber(total)}</Typography>
      </Box>

      <Chart type="bar" series={[{ data: series }]} options={chartOptions} width={60} height={36} />
    </GlassCard>
  );
}

// ----------------------------------------------------------------------

type TrendingInfoProps = {
  percent: number;
};

function TrendingInfo({ percent }: TrendingInfoProps) {
  return (
    <Stack direction="row" alignItems="center" sx={{ mt: 2, mb: 1 }}>
      <Iconify
        icon={percent < 0 ? 'eva:trending-down-fill' : 'eva:trending-up-fill'}
        sx={{
          mr: 1,
          p: 0.5,
          width: 24,
          height: 24,
          borderRadius: '50%',
          color: 'success.main',
          bgcolor: (theme) => alpha(theme.palette.success.main, 0.16),
          ...(percent < 0 && {
            color: 'error.main',
            bgcolor: (theme) => alpha(theme.palette.error.main, 0.16),
          }),
        }}
      />

      <Typography component="div" variant="subtitle2">
        {percent > 0 && '+'}

        {fPercent(percent)}
      </Typography>
    </Stack>
  );
}

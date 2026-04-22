import { Theme } from '@mui/material/styles';

// ----------------------------------------------------------------------

export default function Card(theme: Theme) {
  return {
    MuiCard: {
      styleOverrides: {
        root: {
          position: 'relative',
          boxShadow: theme.customShadows.card,
          borderRadius: Number(theme.shape.borderRadius) * 2,
          zIndex: 0, // Fix Safari overflow: hidden with border radius
          backgroundColor: theme.palette.mode === 'light' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(33, 43, 54, 0.8)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: `1px solid ${theme.palette.mode === 'light' ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.05)'}`,
        },
      },
    },
    MuiCardHeader: {
      defaultProps: {
        titleTypographyProps: { variant: 'h6' },
        subheaderTypographyProps: { variant: 'body2', marginTop: theme.spacing(0.5) },
      },
      styleOverrides: {
        root: {
          padding: theme.spacing(3, 3, 0),
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: theme.spacing(3),
        },
      },
    },
  };
}

// @mui
import { styled, alpha } from '@mui/material/styles';
// utils
import { bgGradient } from '../../utils/cssStyles';

// ----------------------------------------------------------------------

export const StyledRoot = styled('main')(() => ({
  height: '100%',
  display: 'flex',
  position: 'relative',
  minHeight: '100vh',
}));

export const StyledSection = styled('div')(({ theme }) => ({
  display: 'none',
  position: 'relative',
  [theme.breakpoints.up('md')]: {
    flexGrow: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    overflow: 'hidden',
  },
}));

export const StyledSectionBg = styled('div')(({ theme }) => ({
  top: 0,
  left: 0,
  zIndex: -1,
  width: '100%',
  height: '100%',
  position: 'absolute',
  backgroundSize: 'cover',
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'center',
  backgroundImage: 'url(/assets/images/auth/login_bg.png)',
  '&:before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    ...bgGradient({
      direction: '135deg',
      startColor: alpha(theme.palette.primary.darker, 0.5),
      endColor: alpha(theme.palette.primary.main, 0.2),
    }),
    backdropFilter: 'blur(4px)',
  },
}));

export const StyledContent = styled('div')(({ theme }) => ({
  width: 480,
  margin: 'auto',
  display: 'flex',
  minHeight: '100vh',
  justifyContent: 'center',
  padding: theme.spacing(15, 2),
  [theme.breakpoints.up('md')]: {
    flexShrink: 0,
    padding: theme.spacing(10, 8, 0, 8),
    backgroundColor: alpha(theme.palette.background.default, 0.8),
    backdropFilter: 'blur(20px)',
    borderLeft: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
    boxShadow: `-10px 0 40px ${alpha(theme.palette.common.black, 0.1)}`,
  },
}));

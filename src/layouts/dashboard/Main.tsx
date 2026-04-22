import { useRouter } from 'next/router';
// @mui
import { Box, BoxProps } from '@mui/material';
// framer-motion
import { m, AnimatePresence } from 'framer-motion';
// hooks
import useResponsive from '../../hooks/useResponsive';
// config
import { HEADER, NAV } from '../../config-global';
// components
import { useSettingsContext } from '../../components/settings';

// ----------------------------------------------------------------------

const SPACING = 8;

export default function Main({ children, sx, ...other }: BoxProps) {
  const { themeLayout } = useSettingsContext();
  const router = useRouter();

  const isNavHorizontal = themeLayout === 'horizontal';

  const isNavMini = themeLayout === 'mini';

  const isDesktop = useResponsive('up', 'lg');

  const pageTransition = {
    initial: { opacity: 0, y: 15 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
    exit: { opacity: 0, y: -15, transition: { duration: 0.2, ease: 'easeIn' } },
  };

  if (isNavHorizontal) {
    return (
      <Box
        component="main"
        sx={{
          pt: `${HEADER.H_MOBILE + SPACING}px`,
          pb: `${HEADER.H_MOBILE + SPACING}px`,
          ...(isDesktop && {
            px: 2,
            pt: `${HEADER.H_DASHBOARD_DESKTOP + 80}px`,
            pb: `${HEADER.H_DASHBOARD_DESKTOP + SPACING}px`,
          }),
        }}
      >
        <AnimatePresence mode="wait">
          <m.div key={router.pathname} initial="initial" animate="animate" exit="exit" variants={pageTransition}>
            {children}
          </m.div>
        </AnimatePresence>
      </Box>
    );
  }

  return (
    <Box
      component="main"
      sx={{
        flexGrow: 1,
        py: `${HEADER.H_MOBILE + SPACING}px`,
        ...(isDesktop && {
          px: 2,
          py: `${HEADER.H_DASHBOARD_DESKTOP + SPACING}px`,
          width: `calc(100% - ${NAV.W_DASHBOARD}px)`,
          ...(isNavMini && {
            width: `calc(100% - ${NAV.W_DASHBOARD_MINI}px)`,
          }),
        }),
        ...sx,
      }}
      {...other}
    >
      <AnimatePresence mode="wait">
        <m.div key={router.pathname} initial="initial" animate="animate" exit="exit" variants={pageTransition}>
          {children}
        </m.div>
      </AnimatePresence>
    </Box>
  );
}

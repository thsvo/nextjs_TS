// @mui
import { Typography, Stack, Box } from '@mui/material';
// components
import Logo from '../../components/logo';
//
import { StyledRoot, StyledSectionBg, StyledSection, StyledContent } from './styles';

// ----------------------------------------------------------------------

type Props = {
  title?: string;
  illustration?: string;
  children: React.ReactNode;
};

export default function LoginLayout({ children, title }: Props) {
  return (
    <StyledRoot>
      <Logo
        sx={{
          zIndex: 9,
          position: 'absolute',
          mt: { xs: 1.5, md: 5 },
          ml: { xs: 2, md: 5 },
        }}
      />

      <StyledSection>
        <Stack spacing={2} sx={{ zIndex: 1, px: 5, textAlign: 'center', color: 'common.white' }}>
          <Typography variant="h2" sx={{ fontWeight: 800, textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>
            {title || 'Welcome back'}
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.8, maxWidth: 480 }}>
            Experience the next generation of inventory management with AI-powered insights.
          </Typography>
        </Stack>

        <StyledSectionBg />
      </StyledSection>

      <StyledContent>
        <Stack sx={{ width: 1, maxWidth: 400 }}> {children} </Stack>
      </StyledContent>
    </StyledRoot>
  );
}

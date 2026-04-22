import { alpha, styled } from '@mui/material/styles';
import { Card, CardProps } from '@mui/material';

// ----------------------------------------------------------------------

interface GlassCardProps extends CardProps {
  blur?: number;
  opacity?: number;
}

const StyledCard = styled(Card, {
  shouldForwardProp: (prop) => prop !== 'blur' && prop !== 'opacity',
})<GlassCardProps>(({ theme, blur = 10, opacity = 0.08 }) => ({
  backgroundColor: alpha(theme.palette.background.paper, opacity),
  backdropFilter: `blur(${blur}px)`,
  WebkitBackdropFilter: `blur(${blur}px)`,
  border: `1px solid ${alpha(theme.palette.common.white, 0.1)}`,
  boxShadow: theme.customShadows.z12,
  transition: theme.transitions.create(['background-color', 'transform'], {
    duration: theme.transitions.duration.shorter,
  }),
  '&:hover': {
    backgroundColor: alpha(theme.palette.background.paper, opacity + 0.05),
    transform: 'translateY(-4px)',
  },
}));

export default function GlassCard({ children, ...other }: GlassCardProps) {
  return <StyledCard {...other}>{children}</StyledCard>;
}

// @mui
import { List, Stack } from '@mui/material';
// locales
import { useLocales } from '../../../locales';
//
import { NavSectionProps } from '../types';
import { StyledSubheader } from './styles';
import NavList from './NavList';
import { useAuthContext } from '../../../auth/useAuthContext';

// ----------------------------------------------------------------------

export default function NavSectionVertical({ data, sx, ...other }: NavSectionProps) {
  const { translate } = useLocales();

  const { user } = useAuthContext();
  const isAdmin = user?.role === 'admin';
  const allowed = user?.allowedPages || [];

  return (
    <Stack sx={sx} {...other}>
      {data.map((group) => {
        const key = group.subheader || group.items[0].title;

        // Filter items based on allowedPages if NOT admin
        const filteredItems = group.items.filter((item) => {
          if (isAdmin) return true;
          // Extract the last part of the path or use a mapping
          // The backend sends strings like 'inventory', 'restock', etc.
          // We can check if any of the allowed strings are contained in the item path.
          return allowed.some((a: string) => item.path.includes(a.toLowerCase()));
        });

        if (filteredItems.length === 0) return null;

        return (
          <List key={key} disablePadding sx={{ px: 2 }}>
            {group.subheader && (
              <StyledSubheader disableSticky>{`${translate(group.subheader)}`}</StyledSubheader>
            )}

            {filteredItems.map((list) => (
              <NavList
                key={list.title + list.path}
                data={list}
                depth={1}
                hasChild={!!list.children}
              />
            ))}
          </List>
        );
      })}
    </Stack>
  );
}

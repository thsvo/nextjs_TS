/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo } from 'react';
import {
  Box,
  IconButton,
  Popover,
  TextField,
  Stack,
  Checkbox,
  FormControlLabel,
  Button,
  Typography,
  TableCell,
} from '@mui/material';
import Iconify from '../iconify';

export type ColumnFilterProps = {
  values: string[];
  selected: string[] | null;
  onChange: (selected: string[] | null) => void;
  label?: string;
};

export function ColumnFilter({ values, selected, onChange, label }: ColumnFilterProps) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [search, setSearch] = useState('');

  const uniqueValues = useMemo(() => {
    const set = new Set<string>();
    values.forEach((v) => set.add(String(v ?? '').trim() || '(blank)'));
    return Array.from(set).sort();
  }, [values]);

  const filteredValues = useMemo(() => {
    if (!search) return uniqueValues;
    const q = search.toLowerCase();
    return uniqueValues.filter((v) => v.toLowerCase().includes(q));
  }, [uniqueValues, search]);

  const active = selected !== null;

  const toggle = (v: string) => {
    const current = selected ?? uniqueValues.slice();
    const next = current.includes(v) ? current.filter((x) => x !== v) : [...current, v];
    onChange(next.length === uniqueValues.length ? null : next);
  };

  const selectAll = () => onChange(null);
  const clearAll = () => onChange([]);

  return (
    <>
      <IconButton
        size="small"
        color={active ? 'primary' : 'default'}
        onClick={(e) => setAnchor(e.currentTarget)}
        sx={{ ml: 0.5 }}
      >
        <Iconify icon={active ? 'eva:funnel-fill' : 'eva:funnel-outline'} width={16} />
      </IconButton>
      <Popover
        open={Boolean(anchor)}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        PaperProps={{
          sx: {
            p: 0,
            mt: 1.5,
            ml: 0.5,
            width: 260,
            borderRadius: 1.5,
            boxShadow: (theme) => theme.customShadows.dropdown,
          },
        }}
      >
        <Box sx={{ p: 2 }}>
          {label && (
            <Typography variant="subtitle2" sx={{ mb: 1.5, color: 'text.primary' }}>
              {label}
            </Typography>
          )}
          <TextField
            size="small"
            fullWidth
            placeholder="Search values…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled', mr: 1, width: 16 }} />
              ),
            }}
            sx={{
              mb: 2,
              '& .MuiOutlinedInput-root': {
                borderRadius: 1,
              },
            }}
          />
          <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
            <Button
              fullWidth
              size="small"
              variant="soft"
              onClick={selectAll}
              sx={{ borderRadius: 1 }}
            >
              All
            </Button>
            <Button
              fullWidth
              size="small"
              variant="soft"
              color="error"
              onClick={clearAll}
              sx={{ borderRadius: 1 }}
            >
              None
            </Button>
          </Stack>
          <Box
            sx={{
              maxHeight: 240,
              overflowY: 'auto',
              pr: 0.5,
              '&::-webkit-scrollbar': { width: 5 },
              '&::-webkit-scrollbar-thumb': { bgcolor: 'divider', borderRadius: 1 },
            }}
          >
            {filteredValues.map((v) => {
              const checked = selected === null ? true : selected.includes(v);
              return (
                <FormControlLabel
                  key={v}
                  sx={{
                    display: 'flex',
                    m: 0,
                    p: 0.5,
                    borderRadius: 1,
                    '&:hover': { bgcolor: 'background.neutral' },
                  }}
                  control={
                    <Checkbox
                      size="small"
                      checked={checked}
                      onChange={() => toggle(v)}
                      sx={{ p: 0.5 }}
                    />
                  }
                  label={
                    <Typography variant="body2" sx={{ ml: 1 }}>
                      {v}
                    </Typography>
                  }
                />
              );
            })}
            {filteredValues.length === 0 && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', py: 2 }}>
                No matches found.
              </Typography>
            )}
          </Box>
        </Box>
      </Popover>

    </>
  );
}

export type ColumnFilterHeaderProps = {
  label: string;
  rows: any[];
  field: string;
  filters: Record<string, string[] | null>;
  setFilter: (field: string, value: string[] | null) => void;
};

export function FilterableHeader({ label, rows, field, filters, setFilter }: ColumnFilterHeaderProps) {
  const values = rows.map((r) => String(r?.[field] ?? '').trim() || '(blank)');
  return (
    <TableCell>
      <Box sx={{ display: 'flex', alignItems: 'center', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
        {label}
        <ColumnFilter
          values={values}
          selected={filters[field] ?? null}
          onChange={(sel) => setFilter(field, sel)}
          label={`Filter ${label}`}
        />
      </Box>
    </TableCell>
  );
}


export function applyColumnFilters<T extends Record<string, any>>(
  rows: T[],
  filters: Record<string, string[] | null>
): T[] {
  const entries = Object.entries(filters).filter(([, v]) => v !== null);
  if (entries.length === 0) return rows;
  return rows.filter((row) =>
    entries.every(([field, selected]) => {
      const value = String(row?.[field] ?? '').trim() || '(blank)';
      return (selected as string[]).includes(value);
    })
  );
}

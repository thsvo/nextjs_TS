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
  const allSelected = selected?.length === uniqueValues.length;

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
      >
        <Box sx={{ p: 2, width: 260 }}>
          {label && (
            <Typography variant="caption" sx={{ display: 'block', mb: 1, fontWeight: 'bold' }}>
              {label}
            </Typography>
          )}
          <TextField
            size="small"
            fullWidth
            placeholder="Search values…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ mb: 1 }}
          />
          <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
            <Button size="small" onClick={selectAll}>
              All
            </Button>
            <Button size="small" color="error" onClick={clearAll}>
              None
            </Button>
          </Stack>
          <Box sx={{ maxHeight: 240, overflowY: 'auto' }}>
            {filteredValues.map((v) => {
              const checked = selected === null ? true : selected.includes(v);
              return (
                <FormControlLabel
                  key={v}
                  sx={{ display: 'flex', my: 0 }}
                  control={
                    <Checkbox
                      size="small"
                      checked={checked}
                      onChange={() => toggle(v)}
                    />
                  }
                  label={<Typography variant="body2">{v}</Typography>}
                />
              );
            })}
            {filteredValues.length === 0 && (
              <Typography variant="caption" color="text.secondary">
                No matches.
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
    <Box sx={{ display: 'flex', alignItems: 'center', fontWeight: 'bold' }}>
      {label}
      <ColumnFilter
        values={values}
        selected={filters[field] ?? null}
        onChange={(sel) => setFilter(field, sel)}
        label={`Filter ${label}`}
      />
    </Box>
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

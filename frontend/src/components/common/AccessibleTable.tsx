import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableProps,
  Paper,
} from '@mui/material';
import { ReactNode } from 'react';

export interface AccessibleTableColumn {
  id: string;
  label: string;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
}

export interface AccessibleTableProps extends Omit<TableProps, 'children'> {
  caption: string;
  columns: AccessibleTableColumn[];
  children: ReactNode;
  ariaLabel?: string;
}

export const AccessibleTable = ({
  caption,
  columns,
  children,
  ariaLabel,
  ...props
}: AccessibleTableProps) => {
  return (
    <TableContainer component={Paper} role="region" aria-label={ariaLabel || caption}>
      <Table {...props} aria-label={ariaLabel || caption}>
        <caption
          style={{
            position: 'absolute',
            width: '1px',
            height: '1px',
            padding: 0,
            margin: '-1px',
            overflow: 'hidden',
            clip: 'rect(0, 0, 0, 0)',
            whiteSpace: 'nowrap',
            border: 0,
          }}
        >
          {caption}
        </caption>
        <TableHead>
          <TableRow>
            {columns.map((column) => (
              <TableCell
                key={column.id}
                align={column.align || 'left'}
                aria-sort={column.sortable ? 'none' : undefined}
              >
                {column.label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>{children}</TableBody>
      </Table>
    </TableContainer>
  );
};

export default AccessibleTable;

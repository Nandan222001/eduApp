import { Menu, MenuProps, MenuItemProps } from '@mui/material';
import { ReactElement, cloneElement, useState, useEffect } from 'react';
import { useRovingTabIndex } from '../../hooks/useRovingTabIndex';

export interface AccessibleMenuProps extends MenuProps {
  menuLabel: string;
  children: ReactElement<MenuItemProps>[];
}

export const AccessibleMenu = ({
  menuLabel,
  children,
  open,
  onClose,
  ...props
}: AccessibleMenuProps) => {
  const [items, setItems] = useState<ReactElement<MenuItemProps>[]>([]);
  const { getItemProps, focusItem } = useRovingTabIndex(items.length, {
    orientation: 'vertical',
    loop: true,
  });

  useEffect(() => {
    if (Array.isArray(children)) {
      setItems(children);
    } else {
      setItems([children]);
    }
  }, [children]);

  useEffect(() => {
    if (open) {
      setTimeout(() => focusItem(0), 100);
    }
  }, [open, focusItem]);

  const handleClose = (event: React.SyntheticEvent) => {
    if (onClose) {
      onClose(event, 'backdropClick');
    }
  };

  return (
    <Menu
      open={open}
      onClose={handleClose}
      aria-label={menuLabel}
      MenuListProps={{
        'aria-label': menuLabel,
        role: 'menu',
        sx: {
          '&:focus': {
            outline: 'none',
          },
        },
      }}
      {...props}
    >
      {items.map((child, index) => {
        const itemProps = getItemProps(index);
        return cloneElement(child, {
          ...itemProps,
          key: index,
          role: 'menuitem',
          sx: {
            '&:focus-visible': {
              outline: '2px solid',
              outlineColor: 'primary.main',
              outlineOffset: '-2px',
              backgroundColor: 'action.hover',
            },
            ...child.props.sx,
          },
        });
      })}
    </Menu>
  );
};

export default AccessibleMenu;

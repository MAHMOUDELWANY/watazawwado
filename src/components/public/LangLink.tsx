import React from 'react';
import { Link as RouterLink, LinkProps, useLocation } from 'react-router-dom';
import { isArPath, localizedPath } from '../../lib/language';

/**
 * Link for public pages: on an /ar address, links to other public pages stay under /ar.
 * Account links (/student, /staff, ...) and links on the English addresses are left as they are.
 */
export function Link({ to, ...rest }: LinkProps) {
  const { pathname } = useLocation();
  const target = typeof to === 'string' && isArPath(pathname) ? localizedPath(to, 'ar') : to;
  return <RouterLink to={target} {...rest} />;
}

import React from 'react';
import { Link as RouterLink, LinkProps, useLocation } from 'react-router-dom';
import { isEnPath, localizedPath } from '../../lib/language';

/**
 * Link for public pages: on an /en address, links to other public pages stay under /en (QA-05b).
 * Account links (/student, /staff, ...) and links on the Arabic addresses are left as they are.
 */
export function Link({ to, ...rest }: LinkProps) {
  const { pathname } = useLocation();
  const target = typeof to === 'string' && isEnPath(pathname) ? localizedPath(to, 'en') : to;
  return <RouterLink to={target} {...rest} />;
}

import React from 'react';
import { ClipContext } from './Say';
import { FRANCO_TRACK, toFranco } from '../franco';

/** True on a page of the Egyptian Franco track: graphics then show their Arabic words in Franco. */
export function useFranco() {
  return React.useContext(ClipContext).subject === FRANCO_TRACK;
}

/** Every string inside `node` in Franco (graphics write Arabic; the Franco track reads it in Latin letters). */
export function francoNode(node: React.ReactNode): React.ReactNode {
  return React.Children.map(node, (c) => {
    if (typeof c === 'string') return toFranco(c);
    if (React.isValidElement<{ children?: React.ReactNode }>(c) && c.props.children !== undefined) {
      return React.cloneElement(c, undefined, francoNode(c.props.children));
    }
    return c;
  });
}

/** Wraps graphic text: unchanged in Arabic tracks, Franco (left to right, in the Latin font) in the Franco track. */
export function Fr({ children }: { children: React.ReactNode }) {
  return useFranco() ? <span dir="ltr" lang="en" className="font-sans" style={{ fontFamily: 'var(--font-sans, inherit)', fontWeight: 800 }}>{francoNode(children)}</span> : <>{children}</>;
}

import { renderToString } from 'react-dom/server';
import React from 'react';
const el = React.createElement('div', null, 'Hello');
console.log(renderToString(el));

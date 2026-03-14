import { useState, useEffect } from 'react';
import { getPhotoData } from '../api';

export default function LazyPhoto({ id, alt, style }) {
  const [src, setSrc] = useState('');

  useEffect(() => {
    if (id) getPhotoData(id).then(setSrc).catch(() => {});
  }, [id]);

  if (!src) return <div style={{ ...style, background: '#eee', display: 'inline-block' }} />;
  return <img src={src} alt={alt || ''} style={style} />;
}

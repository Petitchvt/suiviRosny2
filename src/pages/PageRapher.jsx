import React from 'react';
import PageAcheteur from './PageAcheteur';
import { ACHETEURS } from '@/lib/acheteurs';

export default function PageRapher() {
  return <PageAcheteur acheteur={ACHETEURS.find(a => a.id === 'rapher')} />;
}
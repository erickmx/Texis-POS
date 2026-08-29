'use client';

import React from 'react';
import { SpecialRequestsBoard } from '@/components/special-requests/SpecialRequestsBoard';

interface SpecialRequestsPageProps {
  params: Promise<{ lng: string }>;
}

export default function SpecialRequestsPage({ params }: SpecialRequestsPageProps) {
  const { lng } = React.use(params);

  return <SpecialRequestsBoard lng={lng} />;
}

'use client';

import { useParams } from 'next/navigation';
import { TransactionDetailView } from '@/components/transactions/TransactionDetailView';

export default function MerchantTransactionDetailPage() {
  const params = useParams();
  const referenceId = decodeURIComponent(params.id as string);

  return <TransactionDetailView referenceId={referenceId} basePath="/merchant" readOnly />;
}

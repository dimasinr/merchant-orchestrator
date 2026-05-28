import { NextRequest, NextResponse } from 'next/server';

const globalForTransactions = global as unknown as {
  serverTransactions: any[];
};

const serverTransactions = globalForTransactions.serverTransactions || (globalForTransactions.serverTransactions = []);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PATCH, PUT',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-merchant-id',
  'Access-Control-Max-Age': '86400',
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function GET(
  req: NextRequest,
  context: any
) {
  const params = await context.params;
  const id = params?.id;
  
  const tx = serverTransactions.find((t) => t.id === id) || serverTransactions.find((t) => t.referenceId === id);

  if (!tx) {
    return NextResponse.json({ error: 'Transaction not found' }, {
      status: 404,
      headers: corsHeaders,
    });
  }

  return NextResponse.json(tx, { headers: corsHeaders });
}

export async function PATCH(
  req: NextRequest,
  context: any
) {
  try {
    const params = await context.params;
    const id = params?.id;
    
    const body = await req.json();
    const { status, message } = body;

    const txIndex = serverTransactions.findIndex((t) => t.id === id || t.referenceId === id);

    if (txIndex === -1) {
      return NextResponse.json({ error: 'Transaction not found' }, {
        status: 404,
        headers: corsHeaders,
      });
    }

    const tx = serverTransactions[txIndex];
    const nowStr = new Date().toISOString();

    const updatedTx = {
      ...tx,
      status,
      updatedAt: nowStr,
      history: [
        ...tx.history,
        { status, timestamp: nowStr, message: message || `Status updated via SDK interface to ${status}` }
      ],
      logs: [
        ...tx.logs,
        { timestamp: nowStr, severity: 'info', message: `Transaction status updated: ${status}`, component: 'API_GATEWAY', traceId: `tr-${id.substring(3)}` }
      ]
    };

    serverTransactions[txIndex] = updatedTx;

    return NextResponse.json(updatedTx, { headers: corsHeaders });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, {
      status: 400,
      headers: corsHeaders,
    });
  }
}

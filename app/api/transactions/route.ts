import { NextRequest, NextResponse } from 'next/server';

// Server-side in-memory mock database of transactions
const globalForTransactions = global as unknown as {
  serverTransactions: any[];
};

if (!globalForTransactions.serverTransactions) {
  globalForTransactions.serverTransactions = [];
}

// Seed a dummy transaction for testing if none exists
if (globalForTransactions.serverTransactions.length === 0) {
  const dummyTx = {
    id: 'tx-dummy-001',
    referenceId: 'DUMMY-REF-001',
    amount: 50000,
    currency: 'IDR',
    status: 'RECEIVED',
    merchantId: 'mer-001',
    merchantName: 'Demo Merchant (Dummy)',
    paymentMethod: 'QRIS',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    errorMessage: null,
    retryCount: 0,
    maxRetries: 3,
    payload: JSON.stringify({ amount: 50000, customer: { name: 'Demo User', email: 'demo@example.com' } }),
    history: [{ status: 'RECEIVED', timestamp: new Date().toISOString(), message: 'Dummy transaction seeded' }],
    logs: [{ timestamp: new Date().toISOString(), severity: 'info', message: 'Dummy transaction created', component: 'API_GATEWAY', traceId: 'tr-dummy-001' }]
  };
  globalForTransactions.serverTransactions.push(dummyTx);
}

const serverTransactions = globalForTransactions.serverTransactions;

// CORS Helper headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PATCH, PUT',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-merchant-id',
  'Access-Control-Max-Age': '86400',
};

// Handle CORS OPTIONS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function GET() {
  return NextResponse.json(serverTransactions, { headers: corsHeaders });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { amount, referenceId, customerName, customerEmail, merchantId } = body;

    const newId = `tx-${Math.floor(Math.random() * 90000) + 10000}`;
    const ref = referenceId || `REF-20260518-${Math.floor(Math.random() * 9000) + 1000}`;
    const nowStr = new Date().toISOString();

    const newTx = {
      id: newId,
      referenceId: ref,
      amount: Number(amount) || 10000,
      currency: 'IDR',
      status: 'RECEIVED',
      merchantId: merchantId || 'mer-001',
      merchantName: 'BrewCraft Café (External SDK)',
      paymentMethod: 'QRIS',
      createdAt: nowStr,
      updatedAt: nowStr,
      errorMessage: null,
      retryCount: 0,
      maxRetries: 3,
      payload: JSON.stringify({ amount, customer: { name: customerName, email: customerEmail } }),
      history: [{ status: 'RECEIVED', timestamp: nowStr, message: 'Gateway accepted transaction via external JS SDK' }],
      logs: [
        { timestamp: nowStr, severity: 'info', message: `Incoming external transaction. Reference: ${ref}`, component: 'API_GATEWAY', traceId: `tr-${newId.substring(3)}` }
      ]
    };

    serverTransactions.unshift(newTx);
    
    if (serverTransactions.length > 100) {
      serverTransactions.pop();
    }

    return NextResponse.json(newTx, {
      status: 201,
      headers: corsHeaders,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, {
      status: 400,
      headers: corsHeaders,
    });
  }
}

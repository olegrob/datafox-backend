import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/config';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { soapAction, body } = await request.json();
    const SOAP_URL = 'https://data.tresoor.ee/DatafoxLADU/SOAP.asmx';

    console.log('Proxying SOAP request:', {
      url: SOAP_URL,
      soapAction,
      body
    });

    const response = await fetch(SOAP_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml;charset=UTF-8',
        'SOAPAction': soapAction
      },
      body: body
    });

    console.log('SOAP Response Status:', response.status);
    const responseHeaders = Object.fromEntries(response.headers.entries());
    console.log('SOAP Response Headers:', responseHeaders);
    
    const data = await response.text();
    console.log('SOAP Response Data:', data);

    return new NextResponse(data, {
      status: response.status,
      headers: {
        'Content-Type': 'text/xml;charset=UTF-8'
      }
    });
  } catch (error) {
    console.error('Error in SOAP proxy:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

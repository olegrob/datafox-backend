import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/config';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { email } = await request.json();
    console.log('Attempting to fetch warehouse ID for email:', email);

    const ACCESS_KEY = 'spIXRybvkv2QVyQmUx8f0cT3hW1mPT9BiN14iT3Fd0g49hqy';
    const SOAP_URL = 'https://data.tresoor.ee/DatafoxLADU/SOAP.asmx';

    const browseLAODBody = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope" xmlns:dat="DatafoxLADU">
   <soap:Header/>
   <soap:Body>
      <dat:BrowseLAOD>
         <!--Optional:-->
         <dat:ACCESS_KEY>${ACCESS_KEY}</dat:ACCESS_KEY>
         <!--Optional:-->
         <dat:sFilter>${email}</dat:sFilter>
      </dat:BrowseLAOD>
   </soap:Body>
</soap:Envelope>`;

    console.log('Sending SOAP request:', browseLAODBody);

    const response = await fetch(SOAP_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml;charset=UTF-8',
        'SOAPAction': 'DatafoxLADU/BrowseLAOD',
        'Accept': 'text/xml'
      },
      body: browseLAODBody
    });

    console.log('SOAP Response Status:', response.status);
    const data = await response.text();
    console.log('SOAP Response Data:', data);

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Detailed error in warehouse-id API:', {
      message: error.message,
      stack: error.stack,
      cause: error.cause
    });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 
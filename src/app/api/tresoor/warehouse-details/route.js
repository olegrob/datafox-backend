import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/config';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { warehouseId } = await request.json();
    const ACCESS_KEY = 'spIXRybvkv2QVyQmUx8f0cT3hW1mPT9BiN14iT3Fd0g49hqy';
    const SOAP_URL = 'https://data.tresoor.ee/DatafoxLADU/SOAP.asmx';

    const browseLaojaakBody = `
      <soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope" xmlns:dat="DatafoxLADU">
        <soap:Header/>
        <soap:Body>
          <dat:BrowseLaojaak>
            <dat:pnLaduID>
              <dat:Value>${warehouseId}</dat:Value>
              <dat:IsNull>false</dat:IsNull>
            </dat:pnLaduID>
            <dat:ACCESS_KEY>${ACCESS_KEY}</dat:ACCESS_KEY>
          </dat:BrowseLaojaak>
        </soap:Body>
      </soap:Envelope>
    `;

    const response = await fetch(SOAP_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/soap+xml;charset=UTF-8',
        'SOAPAction': 'DatafoxLADU/BrowseLaojaak'
      },
      body: browseLaojaakBody
    });

    const data = await response.text();
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error in warehouse-details API:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/config';
import https from 'https';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { warehouseId } = await request.json();
    const ACCESS_KEY = 'spIXRybvkv2QVyQmUx8f0cT3hW1mPT9BiN14iT3Fd0g49hqy';
    const SOAP_URL = 'https://data.tresoor.ee/DatafoxLADU/SOAP.asmx';

    const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:dat="DatafoxLADU">
   <soapenv:Header/>
   <soapenv:Body>
      <dat:BrowseLaojaak>
         <dat:pnLaduID>
            <dat:Value>${warehouseId}</dat:Value>
            <dat:IsNull>false</dat:IsNull>
         </dat:pnLaduID>
         <dat:ACCESS_KEY>${ACCESS_KEY}</dat:ACCESS_KEY>
      </dat:BrowseLaojaak>
   </soapenv:Body>
</soapenv:Envelope>`;

    // Make the request using native https module
    const soapResponse = await new Promise((resolve, reject) => {
      const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml;charset=utf-8',
          'SOAPAction': 'DatafoxLADU/BrowseLaojaak',
          'Content-Length': Buffer.byteLength(soapEnvelope)
        }
      };

      const req = https.request(SOAP_URL, options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => resolve({ statusCode: res.statusCode, headers: res.headers, data }));
      });

      req.on('error', (error) => {
        console.error('Error making SOAP request:', error);
        reject(error);
      });

      req.write(soapEnvelope);
      req.end();
    });

    console.log('SOAP Response:', {
      statusCode: soapResponse.statusCode,
      headers: soapResponse.headers,
      data: soapResponse.data
    });

    if (soapResponse.statusCode === 403) {
      return NextResponse.json({
        error: 'Access Forbidden',
        details: 'The Tresoor API denied access. Please check credentials and IP restrictions.',
        response: soapResponse
      }, { status: 403 });
    }

    return NextResponse.json({ data: soapResponse.data });
  } catch (error) {
    console.error('Error in warehouse-details API:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
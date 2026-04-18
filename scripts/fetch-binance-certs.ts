import axios from 'axios';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

// Simple .env parser to avoid dependency issues in this one-off script
function loadEnv() {
    const envPath = path.join(__dirname, '../.env');
    if (!fs.existsSync(envPath)) return {};
    const content = fs.readFileSync(envPath, 'utf8');
    const config: Record<string, string> = {};
    content.split('\n').forEach(line => {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
        if (match) {
            let value = match[2] || '';
            if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
            if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
            config[match[1]] = value;
        }
    });
    return config;
}

const env = loadEnv();
const BINANCE_PAY_API_KEY = env.BINANCE_PAY_API_KEY;
const BINANCE_PAY_SECRET_KEY = env.BINANCE_PAY_SECRET_KEY;
const BASE_URL = 'https://bpay.binanceapi.com';

async function fetchCertificates() {
    if (!BINANCE_PAY_API_KEY || !BINANCE_PAY_SECRET_KEY) {
        console.error('❌ Error: BINANCE_PAY_API_KEY or BINANCE_PAY_SECRET_KEY not found in .env');
        process.exit(1);
    }

    const endpoint = '/binancepay/openapi/certificates';
    const timestamp = Date.now().toString();
    const nonce = crypto.randomBytes(16).toString('hex');
    const body = {};
    const payload = JSON.stringify(body);

    const signaturePayload = `${timestamp}\n${nonce}\n${payload}\n`;
    const signature = crypto
        .createHmac('sha512', BINANCE_PAY_SECRET_KEY)
        .update(signaturePayload)
        .digest('hex')
        .toUpperCase();

    try {
        console.log('🚀 Fetching certificates from Binance Pay...');
        const response = await axios.post(`${BASE_URL}${endpoint}`, body, {
            headers: {
                'Content-Type': 'application/json',
                'BinancePay-Timestamp': timestamp,
                'BinancePay-Nonce': nonce,
                'BinancePay-Certificate-SN': BINANCE_PAY_API_KEY,
                'BinancePay-Signature': signature,
            },
        });

        if (response.data.status === 'SUCCESS') {
            console.log('✅ Certificates fetched successfully!');
            console.log('====================================');
            console.log(JSON.stringify(response.data.data, null, 2));
            console.log('====================================');
            console.log('\n💡 Recommendation: Copy the "certSerial" and save it as BINANCE_PAY_CERTIFICATE_SN in your .env');
        } else {
            console.error('❌ Error from Binance Pay:', response.data.errorMessage);
            console.error('Full response:', JSON.stringify(response.data, null, 2));
        }
    } catch (error: any) {
        console.error('❌ Request failed:', error.message);
        if (error.response) {
            console.error('Response Status:', error.response.status);
            console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

fetchCertificates();

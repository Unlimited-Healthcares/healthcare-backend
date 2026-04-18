import axios from 'axios';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

// Simple .env parser
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

async function auditPaystack() {
    console.log('\n--- 💳 Auditing Paystack ---');
    const key = env.PAYSTACK_SECRET_KEY;
    if (!key) {
        console.error('❌ PAYSTACK_SECRET_KEY not found in .env');
        return;
    }

    try {
        const response = await axios.get('https://api.paystack.co/balance', {
            headers: { Authorization: `Bearer ${key}` }
        });
        if (response.data.status) {
            console.log('✅ Paystack Key is Valid');
            const mainBalance = response.data.data[0];
            console.log(`💰 Balance: ${mainBalance.balance / 100} ${mainBalance.currency}`);
        } else {
            console.error('❌ Paystack Audit Failed:', response.data.message);
        }
    } catch (error: any) {
        console.error('❌ Paystack Request Failed:', error.response?.data?.message || error.message);
    }
}

async function auditFlutterwave() {
    console.log('\n--- 🌊 Auditing Flutterwave ---');
    const key = env.FLUTTERWAVE_SECRET_KEY;
    if (!key) {
        console.error('❌ FLUTTERWAVE_SECRET_KEY not found in .env');
        return;
    }

    try {
        // Try fetching NGN balances as a check
        const response = await axios.get('https://api.flutterwave.com/v3/balances/NGN', {
            headers: { Authorization: `Bearer ${key}` }
        });
        if (response.data.status === 'success') {
            console.log('✅ Flutterwave Key is Valid');
            console.log(`💰 Balance: ${response.data.data.available_balance} ${response.data.data.currency}`);
        } else {
            console.error('❌ Flutterwave Audit Failed:', response.data.message);
        }
    } catch (error: any) {
        console.error('❌ Flutterwave Request Failed:', error.response?.data?.message || error.message);
    }
}

async function auditBinance() {
    console.log('\n--- 🔶 Auditing Binance Pay ---');
    const apiKey = env.BINANCE_PAY_API_KEY;
    const secretKey = env.BINANCE_PAY_SECRET_KEY;
    if (!apiKey || !secretKey) {
        console.error('❌ Binance credentials missing in .env');
        return;
    }

    const endpoint = '/binancepay/openapi/certificates';
    const timestamp = Date.now().toString();
    const nonce = crypto.randomBytes(16).toString('hex');
    const body = {};
    const payload = JSON.stringify(body);
    const signaturePayload = `${timestamp}\n${nonce}\n${payload}\n`;
    const signature = crypto.createHmac('sha512', secretKey).update(signaturePayload).digest('hex').toUpperCase();

    try {
        const response = await axios.post(`https://bpay.binanceapi.com${endpoint}`, body, {
            headers: {
                'Content-Type': 'application/json',
                'BinancePay-Timestamp': timestamp,
                'BinancePay-Nonce': nonce,
                'BinancePay-Certificate-SN': apiKey,
                'BinancePay-Signature': signature,
            },
        });

        if (response.data.status === 'SUCCESS') {
            console.log('✅ Binance Pay Keys are Valid');
            console.log(`🛡️ Number of active certificates: ${response.data.data.length}`);
        } else {
            console.error('❌ Binance Audit Failed:', response.data.errorMessage);
        }
    } catch (error: any) {
        if (error.code === 'EAI_AGAIN') {
            console.error('⚠️ Binance DNS Error: Still cannot resolve bpay.binanceapi.com locally.');
        } else {
            console.error('❌ Binance Request Failed:', error.response?.data?.errorMessage || error.message);
        }
    }
}

async function runAudit() {
    console.log('🚀 Starting Payment Gateway Audit...\n');
    await auditPaystack();
    await auditFlutterwave();
    await auditBinance();
    console.log('\n🏁 Audit Complete.');
}

runAudit();

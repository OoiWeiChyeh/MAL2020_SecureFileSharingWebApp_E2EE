import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { readFileSync } from 'fs';

const serviceAccount = JSON.parse(readFileSync('./serviceAccountKey.json', 'utf8'));

initializeApp({
    credential: cert(serviceAccount)
});

async function enableTOTP() {
    try {
        console.log('Enabling TOTP MFA for project...');
        await getAuth().projectConfigManager().updateProjectConfig({
            multiFactorConfig: {
                state: "ENABLED",
                providerConfigs: [{
                    state: "ENABLED",
                    totpProviderConfig: {
                        adjacentIntervals: 5
                    }
                }]
            }
        });
        console.log('Successfully enabled TOTP MFA!');
    } catch (error) {
        console.error('Error enabling TOTP:', error);
    }
}

enableTOTP();

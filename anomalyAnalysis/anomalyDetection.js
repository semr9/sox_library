import { businessEventsClient } from '@dynatrace-sdk/client-classic-environment-v2';
import { execution } from '@dynatrace-sdk/automation-utils';

import  patterns  from "https://raw.githubusercontent.com/semr9/sox_library/refs/heads/main/variables/patterns.js"
import  requiredFieldsIntegration15_3_1  from "https://raw.githubusercontent.com/semr9/sox_library/refs/heads/main/variables/integration15-3-1/variable.js"
import  requiredFieldsIntegration15_3_2  from "https://raw.githubusercontent.com/semr9/sox_library/refs/heads/main/variables/integration15-3-2/variable.js"

import {  callMissingTimestampAnomaly, callErrorAnomaly, callInvalidLogFormatAnomaly, 
    fieldOrValueFormatAnomaly, successEvent } from 'https://raw.githubusercontent.com/semr9/sox_library/refs/heads/main/anomalyAnalysis/anomalyFunctions.js';
import {  getPathDict, createAnomalyEvent, transformPatterns } from 'https://raw.githubusercontent.com/semr9/sox_library/refs/heads/main/anomalyAnalysis/utilityFucntions.js';


const newPatterns = transformPatterns(patterns);

const   createBusinessEvent = async (bizevent) => {
  console.log("bizevent::", bizevent)
   try {
        await businessEventsClient.ingest({
            body: bizevent,
            type: 'application/cloudevent+json',
        });
        console.log('Anomaly event ingested:');
        return true;
    } catch (e) {
        console.error('Failed to ingest anomaly event:', e);
        return false;
    } 
}
 


export default async function ({ execution_id }) {
    const ex = await execution(execution_id);
    const myResult = await ex.result('int15-3-2-int15-3-1');
    const records = myResult.records;

    const requiredFields = [ requiredFieldsIntegration15_3_1, requiredFieldsIntegration15_3_2 ]

    for (const record of records) {
        const transaction_id = record["sox_transaction_id"];
        const integrations = record["data"];

        for (let j = 0; j < integrations.length; j++) {
            const integration = integrations[j];
            const next_integration = j + 1 < integrations.length ? integrations[j + 1] : null;

            console.log("integration", integration);
            console.log("next_integration", next_integration);

            if ( await callMissingTimestampAnomaly(crypto.randomUUID(),  transaction_id, integration, next_integration, createAnomalyEvent, createBusinessEvent)) {
                break;
            } else if ( await callInvalidLogFormatAnomaly(crypto.randomUUID(), transaction_id, integration, next_integration, createAnomalyEvent, createBusinessEvent,  newPatterns)) {
                break;
            } else if ( await callErrorAnomaly(crypto.randomUUID(), transaction_id, integration, next_integration, createAnomalyEvent, createBusinessEvent)) {
                break;
            } else if( await fieldOrValueFormatAnomaly(crypto.randomUUID(), transaction_id, integration, next_integration, requiredFields[j], getPathDict, createAnomalyEvent, createBusinessEvent)) {
                break;
            } else {
                await successEvent(crypto.randomUUID(), transaction_id, integration, next_integration, createAnomalyEvent, createBusinessEvent);
                break;
            }
        }
    }
}


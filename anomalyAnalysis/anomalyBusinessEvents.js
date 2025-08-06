// import { businessEventsClient } from '@dynatrace-sdk/client-classic-environment-v2';

async function createBusinessEvent(
    error_category,
    event_type,
    sox_transaction_id,
    sourceIntegration,
    destinationIntegration,
    errorSummary,
    sox_transaction_timestamp,
    valueFrom,
    valueTo
) {
    const bizevent = {
        specversion: "1.0",
        id: crypto.randomUUID(),
        source: "sox",
        type: event_type,
        category: error_category,
        data: {
            transaction_id: sox_transaction_id,
            sourceIntegration: sourceIntegration,
            destinationIntegration: destinationIntegration,
            errorSummary: errorSummary,
            time: sox_transaction_timestamp,
            sourceData: valueFrom,
            destinationData: valueTo
        }
    };

    // console.log("bizevent", bizevent);

    // try {
    //     await businessEventsClient.ingest({
    //         body: bizevent,
    //         type: 'application/cloudevent+json',
    //     });
    //     console.log('Anomaly event ingested:');
    // } catch (e) {
    //     console.error('Failed to ingest anomaly event:', e);
    // }
    console.log("Anomaly event ingested");  
    console.log("bizevent", bizevent);
    console.log("--------------------------------");
    return true;
}

export default createBusinessEvent;
// error_category  => Error | ok
// event_type => Missing Timestamp | Invalid Log Format | Missing Field | Missing Value | Invalid Field Format | Field Variations
// sox_transaction_id => transaction_id
// sourceIntegration => sox_integration
// destinationIntegration => sox_integration
// errorSummary => {   
//                              "Missing Field": { paths: [], values: [] }, 
//                              "Missing Value": { paths: [], values: [] }, 
//                              "Invalid Field Format": { paths: [], values: [] }, 
//                              "Field Variations": { paths: [], sourceValues: [], destinationValues: [] } 
//                              }   
// sox_transaction_timestamp => sox_transaction_timestamp
// valueFrom => sourceData
// valueTo => destinationData


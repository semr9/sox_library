
async function createBusinessEvent(
    id,
    error_category,
    event_type,
    sox_transaction_id,
    sourceIntegration,
    destinationIntegration,
    errorSummary,
    sox_transaction_timestamp,
    valueFrom,
    valueTo,
    businessEventFunction
) {
    const bizevent = {
        specversion: "1.0",
        id: id,
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

    return await businessEventFunction(bizevent);
   
}

export default createBusinessEvent;

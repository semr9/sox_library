
const normalizePath = (path) => path.replace(/<array\d+>/g, '<array>');


const getPathDict = (obj, currentPath = '') => {
    const pathDict = {};

    const processValue = (value, path) => {
        if (value === null || value === undefined) {
            pathDict[path] = value;
            return;
        }
        if (Array.isArray(value)) {
            value.forEach((item, index) => {
                const arrayPath = `${path}<array${index + 1}>`;
                processValue(item, arrayPath);
            });
        } else if (typeof value === 'object') {
            Object.keys(value).forEach(key => {
                const newPath = path ? `${path}.${key}` : key;
                processValue(value[key], newPath);
            });
        } else {
            pathDict[path] = value;
        }
    };

    processValue(obj, currentPath);
    return pathDict;
};


async function createAnomalyEvent(
    id,
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

    return bizevent;
   
}

export { normalizePath, getPathDict, createAnomalyEvent };

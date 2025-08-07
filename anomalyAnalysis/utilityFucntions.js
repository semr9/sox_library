
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

const transformPatterns = (stringPatterns) => {
    const transformed = {};
    for (const [key, value] of Object.entries(stringPatterns)) {
      if (typeof value === 'string') {
        // Check if it's already a RegExp string format
        if (value.startsWith('/') && value.endsWith('/')) {
          // Extract the pattern and flags
          const pattern = value.slice(1, -1);
          transformed[key] = new RegExp(pattern);
        } else {
          // Treat as plain string pattern
          transformed[key] = new RegExp(value);
        }
      } else {
        // If it's already a RegExp, keep it as is
        transformed[key] = value;
      }
    }
    return transformed;
  };

export { normalizePath, getPathDict, createAnomalyEvent , transformPatterns};

import { createBusinessEvent } from './anomalyBusinessEvents.js';   
import patterns from '../variables/patterns.js';
import requiredFieldsIntegration15_3_1 from '../variables/integration15-3-1/variable.js';
import requiredFieldsIntegration15_3_2 from '../variables/integration15-3-2/variable.js';

// Simplified validation functions
const isEmpty = (value) => {
    if (value === undefined ) return true;
    if (typeof value === 'string') return value.trim() === '';
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object') return Object.keys(value).length === 0;
    return false;
};

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

const normalizePath = (path) => path.replace(/<array\d+>/g, '<array>');


// anomaly detection functions
const callMissingTimestampAnomaly = async (integration, transaction_id, next_integration) => {
    const timestamp = integration["sox_transaction_timestamp"];
    if (timestamp == null){
        await createBusinessEvent(
            "Error",
            "Missing Timestamp",
            transaction_id,
            integration["sox_integration"],
            next_integration ? next_integration["sox_integration"] : "-",
            { 
                "Missing Timestamp": { paths: ["sox_transaction_timestamp"], values: [null] }, 
            },
            null,
            "-",
            "-"
        );
        return true;
    }else{
        return false;
    }
};

const callErrorAnomaly = async (integration, transaction_id, next_integration) => {
    const statusCode = parseInt(integration["sox_transaction_response_code"]);
    if (statusCode >= 200 && statusCode < 300) {
        return false;
    }else{
        await createBusinessEvent(
            "Error",
            "Call Error",
            transaction_id,
            integration["sox_integration"],
            next_integration ? next_integration["sox_integration"] : "-",
            {
                "Call Error": { paths: ["sox_transaction_response_code"], values: [statusCode] },
            },
            integration["sox_transaction_timestamp"],
            "-",
            "-"
        );
        return true;
    }
};

const callInvalidLogFormatAnomaly = async (integration, transaction_id, next_integration) => {
    let errorSummary = {};
    if ( integration["sox_integration"] == null){
        errorSummary["Missing Integration Id"] = { paths: ["sox_integration"], values: [null] };
    }else{
        // Check if integration ID format is correct
        const integrationId = integration["sox_integration"];
        if (!patterns.alphanumericUppercase.test(String(integrationId))) {
            errorSummary["Invalid Integration Id Format"] = { paths: ["sox_integration"], values: [integrationId] };
        }
    }

    if ( integration["content"] == null){
        errorSummary["Missing Payload"] = { paths: ["content"], values: [null] };
    }

    if ( integration["sox_transaction_id"] == null){
        errorSummary["Missing Transaction Id"] = { paths: ["sox_transaction_id"], values: [null] };
    }else{
        // Check if transaction ID format is correct
        const transactionId = integration["sox_transaction_id"];
        if (!patterns.transactionId.test(String(transactionId))) {
            errorSummary["Invalid Transaction Id Format"] = { paths: ["sox_transaction_id"], values: [transactionId] };
        }
    }

    let response = false;
    if (Object.keys(errorSummary).length > 0) {
        await createBusinessEvent(
            "Error",
            "Invalid Log Format",
            transaction_id,
            integration["sox_integration"],
            next_integration ? next_integration["sox_integration"] : "-",
            errorSummary,
            integration["sox_transaction_timestamp"],
                "-",
                "-"
            );
        response = true;
    }else{
        response = false;
    }

    return response;
};


// Fields/Values Format Anomaly
const checkMissingField = (value) => value == null;
const checkMissingValue = (value) => isEmpty(value);
const checkFieldVariations = (value1, value2) => value1 != value2;
const checkInvalidFieldFormat = (value, path, requiredFields) => {
    const pattern = requiredFields[path];
    return pattern ? !pattern.test(String(value)) : false;
};

const fieldOrValueFormatAnomaly = async (integration, transaction_id, next_integration, requiredFields) => {
    const paths = getPathDict(JSON.parse(integration["content"]));
    const paths_next_integration = next_integration ? getPathDict(JSON.parse(next_integration["content"])) : {};

    const errors = {
        "Missing Field": { paths: [], values: [] },
        "Missing Value": { paths: [], values: [] },
        "Invalid Field Format": { paths: [], values: [] },
        "Field Variations": { paths: [], sourceValues: [], destinationValues: [] }
    };

    let hasErrors = false;

    for (const [path, value] of Object.entries(paths)) {
        const normalizedPath = normalizePath(path);
        
        if (checkMissingField(value)) {
            hasErrors = true;
            errors["Missing Field"].paths.push(path);
            errors["Missing Field"].values.push(value);
        } else if (checkMissingValue(value)) {
            hasErrors = true;
            errors["Missing Value"].paths.push(path);
            errors["Missing Value"].values.push(value);
        } else if (checkInvalidFieldFormat(value, normalizedPath, requiredFields)) {
            hasErrors = true;
            errors["Invalid Field Format"].paths.push(path);
            errors["Invalid Field Format"].values.push(value);
        } else if (next_integration && paths_next_integration[path] != null && checkFieldVariations(value, paths_next_integration[path])) {
            hasErrors = true;
            errors["Field Variations"].paths.push(path);
            errors["Field Variations"].sourceValues.push(value);
            errors["Field Variations"].destinationValues.push(paths_next_integration[path]);
        }
    }

    if (hasErrors) {
        
        await createBusinessEvent(
            "Error",
            "Field/Value Format Anomaly",
            transaction_id,
            integration["sox_integration"],
            next_integration ? next_integration["sox_integration"] : "-",
            errors,
            integration["sox_transaction_timestamp"],
            "-",
            "-"
        );
        return true;
    }else{
        return false;
    }
        
}


//main fucntion that do the anomaly analysis

async function anomalyAnalysis(records, requiredFields){

    for (const record of records) {
        const transaction_id = record["sox_transaction_id"];
        const integrations = record["data"];

        for (let j = 0; j < integrations.length; j++) {
            const integration = integrations[j];
            const next_integration = j + 1 < integrations.length ? integrations[j + 1] : null;

            console.log("integration", integration);
            console.log("next_integration", next_integration);

            // if ( callMissingTimestampAnomaly(integration, transaction_id, next_integration)) {
            //     break;
            // } else if ( callInvalidLogFormatAnomaly(integration, transaction_id, next_integration)) {
            //     break;
            // } else if ( callErrorAnomaly(integration, transaction_id, next_integration)) {
            //     break;
            // } else if( fieldOrValueFormatAnomaly(integration, transaction_id, next_integration, requiredFields[j])) {
            //     break;
            // } else {
            //     await createBusinessEvent(
            //         "OK",
            //         "Successful",
            //         transaction_id,
            //         integration["sox_integration"],
            //         next_integration ? next_integration["sox_integration"] : "-",
            //         "-",
            //         integration["sox_transaction_timestamp"],
            //         "-",
            //         "-"
            //     );
            // }
        }
    }
}

export default anomalyAnalysis;

// export default async function ({ execution_id }) {
//     const ex = await execution(execution_id);
//     const myResult = await ex.result('int26-int30');
//     const records = myResult.records;

//     const requiredFields = [ requiredFieldsIntegration15_3_1, requiredFieldsIntegration15_3_2 ]

//     await anomalyAnalysis(records, requiredFields);
// }

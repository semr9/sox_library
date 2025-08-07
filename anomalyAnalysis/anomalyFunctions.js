const callMissingTimestampAnomaly = async (id, transaction_id, integration, next_integration, createAnomalyEvent, createBusinessEvent) => {
    const timestamp = integration["sox_transaction_timestamp"];
    console.log("timestamp", timestamp);
    if (timestamp == null){
        const bizevent = await createAnomalyEvent(
            id,
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
        try{ 
            await createBusinessEvent(bizevent);
            return true;
        }catch(e){
            console.error("Error creating business event:", e);
            return false;
        }
    }else{
        return false;
    }
};

const callErrorAnomaly = async (id, transaction_id, integration, next_integration, createAnomalyEvent, createBusinessEvent) => {
    const statusCode = parseInt(integration["sox_transaction_response_code"]);
    if (statusCode >= 200 && statusCode < 300) {
        return false;
    }else{
        const bizevent = await createAnomalyEvent(
            id,
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
        try{ 
            await createBusinessEvent(bizevent);
            return true;
        }catch(e){
            console.error("Error creating business event:", e);
            return false;
        }
    }
};

const callInvalidLogFormatAnomaly = async (id, transaction_id, integration, next_integration, createAnomalyEvent, createBusinessEvent, patterns, transformPatterns) => {
    let errorSummary = {};
    if ( integration["sox_integration"] == null){
        errorSummary["Missing Integration Id"] = { paths: ["sox_integration"], values: [null] };
    }else{
        // Check if integration ID format is correct
        const integrationId = integration["sox_integration"];
        if (!transformPatterns(patterns["alphanumericUppercase"]).test(String(integrationId))) {
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
        if (!transformPatterns(patterns["transactionId"]).test(String(transactionId))) {
            errorSummary["Invalid Transaction Id Format"] = { paths: ["sox_transaction_id"], values: [transactionId] };
        }
    }

    if (Object.keys(errorSummary).length > 0) {
        const bizevent = await createAnomalyEvent(
            id,
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
        try{ 
            await createBusinessEvent(bizevent);
            return true;
        }catch(e){
            console.error("Error creating business event:", e);
            return false;
        }
    }else{
        return false;
    }
};



const fieldOrValueFormatAnomaly = async (id, integration, transaction_id, next_integration, requiredFields, getPathDict, createAnomalyEvent, createBusinessEvent) => {
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
        const normalizedPath = path.replace(/<array\d+>/g, '<array>');
        
        if ( value == null) {
            hasErrors = true;
            errors["Missing Field"].paths.push(path);
            errors["Missing Field"].values.push(value);
        } else if (value == undefined || value.trim() === '' || value.length === 0 || Object.keys(value).length === 0) {
            hasErrors = true;
            errors["Missing Value"].paths.push(path);
            errors["Missing Value"].values.push(value);
        } else if (requiredFields[normalizedPath] && !requiredFields[normalizedPath].test(String(value))) {
            hasErrors = true;
            errors["Invalid Field Format"].paths.push(path);
            errors["Invalid Field Format"].values.push(value);
        } else if (next_integration && paths_next_integration[path] != null && value != paths_next_integration[path]) {
            hasErrors = true;
            errors["Field Variations"].paths.push(path);
            errors["Field Variations"].sourceValues.push(value);
            errors["Field Variations"].destinationValues.push(paths_next_integration[path]);
        }
    }

    if (hasErrors) {
        
        const bizevent = await createAnomalyEvent(
            id,
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
        try{ 
            await createBusinessEvent(bizevent);
            return true;
        }catch(e){
            console.error("Error creating business event:", e);
            return false;
        }
    }else{
        return false;
    }
        
}

const successEvent = async (id, transaction_id, integration, next_integration, createAnomalyEvent, createBusinessEvent) => {
    let bizevent = await createAnomalyEvent(
        id,
        "OK",
        "Successful",
        transaction_id,
        integration["sox_integration"],
        next_integration ? next_integration["sox_integration"] : "-",
        "-",
        integration["sox_transaction_timestamp"],
        "-",
        "-"
    );
    try{ 
        await createBusinessEvent(bizevent);
        return true;
    }catch(e){
        console.error("Error creating business event:", e);
        return false;
    }
}

export { callMissingTimestampAnomaly, callErrorAnomaly, callInvalidLogFormatAnomaly, fieldOrValueFormatAnomaly, successEvent };
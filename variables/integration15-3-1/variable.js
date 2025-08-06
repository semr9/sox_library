import patterns from '../patterns.js';

const requiredFields = {
    "confirmationIds<array1>.value": patterns.alphanumericUppercase,
    "propertyCode": patterns.alphanumericUppercase
  } 

  export default requiredFields;
import patterns from '../patterns.js';

const requiredFields = {
    "confirmationIds<array>.value": patterns.alphanumericUppercase,
    "propertyCode": patterns.alphanumericUppercase,
    "guestInformation.altCustId": patterns.alphanumericWithSpecial
  }

  export default requiredFields;
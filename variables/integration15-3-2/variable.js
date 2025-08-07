import patterns from '../patterns.js';

const requiredFieldsIntegration15_3_2 = {
    "confirmationIds<array>.value": patterns["alphanumericUppercase"],
    "propertyCode": patterns["alphanumericUppercase"],
    "guestInformation.altCustId": patterns["alphanumericWithSpecial"]
  }

  export default requiredFieldsIntegration15_3_2;
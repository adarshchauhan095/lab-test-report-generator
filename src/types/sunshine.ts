export interface TestParameterRow {
  id: string;
  srNo: number;
  commodity: string;
  parameterName: string;
  result: string;
}

export interface SunshineReport {
  id: string;
  reportNo: string;
  issuedTo: string;
  buyer: string;
  commodity: string;
  vehicleNo: string;
  noOfBags: string;
  netWeight: string;
  grossWeight: string;
  sampleCode: string;
  samplePackaging: string;
  sampleDate: string;
  sampleReceiveDate: string;
  reportIssueDate: string;
  parameters: TestParameterRow[];
  declaration: string;
  createdAt: string;
  updatedAt: string;
}

export const DEFAULT_DECLARATION = 
  '1. The results listed refer only to the tested sample. ' +
  '2. Total liability of our laboratory is limited to the invoiced amount. ' +
  '3. This report cannot be reproduced wholly or in part without prior approval of the laboratory.';

export const LAB_DETAILS = {
  name: 'SUNSHINE ANALYTICAL LAB.',
  tagline: 'Advanced Quality Testing & Commercial Analysis Facility',
  address: 'Rahul Cement, Near Hansi Road Karnal, Karnal (Haryana) 132001',
  phone: '7015676780',
  email: 'Sunshineanalyticallab@gmail.com',
};

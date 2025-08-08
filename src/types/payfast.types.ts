export interface PayfastConfig {
  merchantId: string;
  securedKey: string;
  baseUrl: string;
}

export interface PaymentRequest {
  basketId: string;
  transAmount: string;
  currencyCode: string;
  customerEmail: string;
  customerMobile: string;
  orderDate: string;
  txnDesc: string;
}

export interface PayfastResponse {
  errCode: string;
  errMsg: string;
  transactionId: string;
  basketId: string;
  orderDate: string;
  validationHash: string;
}

export enum UserType {
  USER = "user",
  ADMIN = "admin",
  EMPLOYEE = "employee",
  SUPERADMIN = "superadmin",
}

export enum Gender {
  MALE = "Male",
  FEMALE = "Female",
}

export enum CourtType {
  SUPREME_COURT = "Supreme Court",
  HIGH_COURT = "High Court",
  LOWER_COURT = "Lower Court",
}

export enum PaymentMethods {
  ONLINE = "online",
  CASH = "cash",
  JAZZCASH = "jazzcash",
}

export enum AppointmentType {
  ONLINE = "online",
  PHYSICAL = "physical",
}

export enum BookingStatus {
  CONFIRMED = "confirmed",
  CANCELLED = "cancelled",
  COMPLETED = "completed",
}

export enum PaymentStatus {
  PENDING = "pending",
  PAID = "paid",
  UNPAID = "unpaid",
  REFUNDED = "refunded",
  FAILED = "failed",
  REFUND_INITIATED = "refund_initiated",
}

export enum TransactionStatus {
  PENDING = "pending",
  SUCCESS = "success",
  FAILED = "failed",
}

export enum WalletTransactionType {
  DEBIT = "debit",
  CREDIT = "credit",
}

export enum PromoCodeType {
  PERCENT = "percent",
  FIXED = "fixed",
}

export enum PaymentType {
  ONLINE = "online",
  CASH = "cash",
}

export enum PromoCodeStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
}

export enum VerificationStatus {
  PENDING = "Pending",
  VERIFIED = "Verified",
  REJECTED = "Rejected",
  RE_SUBMITTED = "Re-Submitted",
}

export enum RefundStatus {
  NONE = "none",
  PARTIAL = "partial",
  FULL = "full",
}

export enum PaymentGatewayMethod {
  CARD = "Card",
  EASYPASA = "Easypaisa",
  JAZZCASH = "Jazzcash",
  WALLET = "Wallet",
}

export enum TransactionType {
  CREDIT = "credit",
  DEBIT = "debit",
}

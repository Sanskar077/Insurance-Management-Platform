import type { Customer } from '@prisma/client';

export interface CustomerDto {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  dob: Date;
  createdAt: Date;
  updatedAt: Date;
}

export function toCustomerDto(customer: Customer): CustomerDto {
  return {
    id: customer.id,
    userId: customer.userId,
    fullName: customer.fullName,
    email: customer.email,
    phone: customer.phone,
    address: customer.address,
    dob: customer.dob,
    createdAt: customer.createdAt,
    updatedAt: customer.updatedAt,
  };
}

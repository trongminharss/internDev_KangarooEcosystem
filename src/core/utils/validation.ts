export const FValidatePhone = (phone: string): boolean => {
  const regex = /^(03|05|07|08|09)\d{8}$/;
  return regex.test(phone.trim());
};

export const FValidateEmail = (email: string): boolean => {
  const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return regex.test(email.trim());
};

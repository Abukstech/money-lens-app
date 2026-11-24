export function validEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}
export function passwordError(password: string, confirmation: string) {
  if (password.length < 12 || password.length > 128)
    return "Use between 12 and 128 characters.";
  if (password !== confirmation) return "Your passwords don’t match.";
  return null;
}
export function formatMoney(amount: string) {
  const [whole, fraction = ""] = amount.split(".");
  return `₦${whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}.${fraction.padEnd(2, "0")}`;
}

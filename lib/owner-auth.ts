const ownerPin = process.env.OWNER_PIN;

export function verifyOwnerPin(pin: string | null | undefined) {
  if (!ownerPin) {
    return false;
  }

  return pin === ownerPin;
}
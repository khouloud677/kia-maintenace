const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function makeAppointmentReference(prefix = "KIA") {
  let randomPart = "";
  for (let i = 0; i < 7; i += 1) {
    randomPart += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }

  return `${prefix}-${randomPart}`;
}

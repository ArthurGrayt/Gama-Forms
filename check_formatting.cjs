const { format, parseISO } = require('date-fns');
const { ptBR } = require('date-fns/locale');

const dbString = "2026-02-18T12:57:06.707+00:00"; // Value from DB
console.log("DB String (UTC):", dbString);

// Simulate Client formatting via date-fns
// Note: Node process usually uses system timezone.
const date = parseISO(dbString);
console.log("Parsed Date:", date.toString());

const formatted = format(date, 'dd/MM/yyyy HH:mm:ss', { locale: ptBR });
console.log("Formatted in Local Time:", formatted);

// Check Offset
const offset = date.getTimezoneOffset();
console.log("Timezone Offset (minutes):", offset);

// Hypothesis Check
// If User expects 12:57, and sees 09:57.
if (formatted.includes("09:57")) {
    console.log("MATCH: Display shows 09:57 (3 hours behind UTC string).");
    console.log("If user entered 12:57 and it was saved as 12:57 UTC, then this confirms the issue: Input was saved as UTC without conversion.");
} else if (formatted.includes("12:57")) {
    console.log("MISMATCH: Display shows 12:57. Client is showing UTC time?");
} else {
    console.log("Check output manually.");
}

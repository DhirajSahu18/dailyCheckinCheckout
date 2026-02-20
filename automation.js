import axios from "axios";
import { wrapper } from "axios-cookiejar-support";
import { CookieJar } from "tough-cookie";
import cron from "node-cron";

const BASE = "https://erp.atriina.com";

const ACCOUNTS = [
  { email: "kewal.tembwalkar@atriina.com", password: "Incorrect007@", emp: "HR-EMP-00327" },
  { email: "dhiraj.sahu@atriina.com", password: "Dhiraj@10@", emp: "HR-EMP-00326" },
];

async function login(email, password) {
  const jar = new CookieJar();
  const client = wrapper(axios.create({ jar, withCredentials: true }));

  const res = await client.post(
    `${BASE}/login`,
    new URLSearchParams({
      cmd: "login",
      usr: email,
      pwd: password,
    }),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "X-Frappe-CMD": "login",
      },
    }
  );

  return { client, csrf: res.data.csrf_token };
}

async function checkin(client, csrf, emp, type) {
  const doc = {
    docstatus: 0,
    doctype: "Employee Checkin",
    log_type: type,
    employee: emp,
    time: new Date().toISOString().slice(0, 19).replace("T", " "),
    custom_working_from: "Client Visit",
  };

  await client.post(
    `${BASE}/api/method/frappe.desk.form.save.savedocs`,
    new URLSearchParams({
      doc: JSON.stringify(doc),
      action: "Save",
    }),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "X-Frappe-CSRF-Token": csrf,
        "X-Requested-With": "XMLHttpRequest",
      },
    }
  );

  console.log(`[${new Date().toISOString()}] ✅ ${type} recorded for ${emp}`);
}

async function run(type) {
  for (const { email, password, emp } of ACCOUNTS) {
    try {
      console.log(`\nProcessing ${email}...`);
      const { client, csrf } = await login(email, password);
      await checkin(client, csrf, emp, type);
    } catch (err) {
      console.error(`❌ Failed for ${email}:`, err.message);
    }
  }
}

// 9:30 AM IST — Check IN (Mon–Fri)
cron.schedule("30 9 * * 1-5", () => run("IN"), { timezone: "Asia/Kolkata" });

// 7:30 PM IST — Check OUT (Mon–Fri)
cron.schedule("32 19 * * 1-5", () => run("OUT"), { timezone: "Asia/Kolkata" });

console.log("🕐 Scheduler started. Waiting for scheduled times (IST)...");
console.log("   Check IN  → 9:30 AM IST  (Mon–Fri)");
console.log("   Check OUT → 7:30 PM IST  (Mon–Fri)");

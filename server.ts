import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { google } from "googleapis";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// --- Google Sheets Integration ---
// Sheets structure:
// Users: id, username, role, registrationDate, balance, lastIdChangeDate
// Transactions: userId, date, type, amount
// IdLogs: oldId, newId, date

let sheets: any = null;
let spreadsheetId = process.env.GOOGLE_SHEET_ID;

if (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY && spreadsheetId) {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
    sheets = google.sheets({ version: "v4", auth });
    console.log("Google Sheets API initialized.");
  } catch (error) {
    console.error("Failed to initialize Google Sheets API:", error);
  }
}

// --- Mock Data (Fallback & Initial State) ---
let mockUsers = [
  {
    id: "user_1",
    username: "AdminUser",
    role: "Администратор",
    registrationDate: "01.04.2026",
    balance: 50000,
    lastIdChangeDate: null,
  },
  {
    id: "user_2",
    username: "Newbie_01",
    role: "Новичок",
    registrationDate: "02.04.2026",
    balance: 10000,
    lastIdChangeDate: null,
  },
];

let mockTransactions = [
  { userId: "user_1", date: "01.04.2026 12:00", type: "Пополнение", amount: 50000 },
  { userId: "user_2", date: "02.04.2026 14:30", type: "Пополнение", amount: 10000 },
];

let mockIdLogs: any[] = [];

// Helper to write to Google Sheets
async function appendToSheet(range: string, values: any[]) {
  if (!sheets || !spreadsheetId) return;
  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range,
      valueInputOption: "RAW",
      requestBody: { values: [values] },
    });
  } catch (error) {
    console.error(`Error appending to sheet ${range}:`, error);
  }
}

// --- API Routes ---

// Get current user profile
app.get("/api/user/profile/:id", async (req, res) => {
  const { id } = req.params;
  
  // In a real app, we would fetch from Sheets here.
  // For this demo, we use mock data but provide the logic structure.
  const user = mockUsers.find((u) => u.id === id);
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json(user);
});

// Get all users
app.get("/api/users", (req, res) => {
  res.json(mockUsers);
});

// Get balance history
app.get("/api/user/transactions/:id", (req, res) => {
  const { id } = req.params;
  const history = mockTransactions.filter((t) => t.userId === id);
  res.json(history);
});

// Change User ID (Paid Function)
app.post("/api/user/change-id", async (req, res) => {
  const { userId, newUsername } = req.body;
  const cost = 15000;

  const userIndex = mockUsers.findIndex((u) => u.id === userId);
  if (userIndex === -1) return res.status(404).json({ error: "User not found" });

  const user = mockUsers[userIndex];

  // 1. Check uniqueness
  if (mockUsers.some((u) => u.username.toLowerCase() === newUsername.toLowerCase())) {
    return res.status(400).json({ error: "Этот ID уже занят" });
  }

  // 2. Check balance
  if (user.balance < cost) {
    return res.status(400).json({ error: "Недостаточно средств на балансе (нужно 15 000 ₸)" });
  }

  // 3. Check frequency (30 days)
  if (user.lastIdChangeDate) {
    const lastChange = new Date(user.lastIdChangeDate);
    const now = new Date();
    const diffDays = Math.ceil((now.getTime() - lastChange.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 30) {
      return res.status(400).json({ error: `Смена ID возможна не чаще одного раза в 30 дней. Осталось: ${30 - diffDays} дн.` });
    }
  }

  // 4. Process payment and change
  const oldUsername = user.username;
  user.balance -= cost;
  user.username = newUsername;
  const nowStr = new Date().toLocaleString("ru-RU");
  user.lastIdChangeDate = new Date().toISOString();

  // 5. Log transaction
  const transaction = {
    userId: user.id,
    date: nowStr,
    type: "Списание (Смена ID)",
    amount: cost,
  };
  mockTransactions.push(transaction);
  await appendToSheet("Transactions!A:D", [transaction.userId, transaction.date, transaction.type, transaction.amount]);

  // 6. Log ID change
  const idLog = {
    oldId: oldUsername,
    newId: newUsername,
    date: nowStr,
  };
  mockIdLogs.push(idLog);
  await appendToSheet("IdLogs!A:C", [idLog.oldId, idLog.newId, idLog.date]);

  // 7. Update User in Sheet (Placeholder for full update logic)
  // In a real app, you'd find the row and update it.
  // await updateSheetRow("Users", userIndex + 2, [user.id, user.username, ...]);

  res.json({ message: "ID успешно изменен!", user });
});

// --- Vite Middleware ---
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

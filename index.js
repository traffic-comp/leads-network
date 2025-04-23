const express = require("express");
const { google } = require("googleapis");
const app = express();
const format = require("date-format");
const dotenv = require("dotenv");
dotenv.config();
const mongoose = require("mongoose");
const logModel = require("./models/log.model.js");

app.use(express.json());

// Очередь для запросов
let queue = [];

async function getSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(process.env.GOOGLE_CRED),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const client = await auth.getClient();
  return google.sheets({ version: "v4", auth: client });
}

const SPREADSHEET_ID = "1Fsknq-JhWjUy7RH6bTVPkdcXFbFldIZz2zbyesS6wc8";

async function appendToSheet(data) {
  const sheets = await getSheetsClient();
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: "test!A:A",
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [data],
    },
  });
  console.log("✅ Данные успешно добавлены!");
}

// Сохраняем лог в MongoDB
const saveLog = async (logData) => {
  console.log(logData, format("dd-MM-yyyy, hh:mm"));
  const log = await new logModel({ strLog: JSON.stringify(logData) });
  log.save();
  console.log("Логи сохранены");
};


async function appendToSheet(data) {
  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(process.env.GOOGLE_CRED),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const client = await auth.getClient();
  const sheets = google.sheets({ version: "v4", auth: client });

  const spreadsheetId = "1Fsknq-JhWjUy7RH6bTVPkdcXFbFldIZz2zbyesS6wc8";
  const range = "test!A:A";

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [data],
    },
  });

  console.log("✅ Данные успешно добавлены!");
}

app.get("/record", async (req, res) => {
  try {
    const { username, fullname, userId, payload } = req.query;
    console.log("🔹 Запрос получен:", JSON.stringify(req.query));

    const [advertisment, geo] = payload.split("-");
    const recordData = [];
    await saveLog({
      query: req.query,
      payload,
    });

    recordData.push(
      username,
      fullname,
      userId,
      advertisment,
      geo,
      format("dd-MM-yyyy, hh:mm")
    );

    appendToSheet(recordData);
    res.status(200).send("✅ Записано в таблицу");
  } catch (err) {
    console.error("❌ Ошибка в маршруте:", err);
    res.status(500).send("❌ Ошибка при записи");
  }
});

// Маршрут для получения данных
// app.get("/record", async (req, res) => {
//   try {
//     const { username, fullname, userId, payload } = req.query;
//     // const timestamp = format("dd-MM-yyyy, hh:mm");
//     const timestamp = formatDateTimeManualUTC2(timestamp)
//     // Добавляем запрос в очередь
//     queue.push({ username, fullname, userId, payload, timestamp });

//     console.log(`🔹 Запрос добавлен в очередь: ${JSON.stringify(req.query)}`);

//     // Сохраняем лог
//     await saveLog({ query: req.query, timestamp });

//     // Если очередь не пуста, начинаем обработку
//     if (queue.length === 1) {
//       processQueue();
//     }

//     res.status(200).send("✅ Запрос принят и добавлен в очередь");
//   } catch (err) {
//     console.error("❌ Ошибка в /record:", err);
//     res.status(500).send("❌ Ошибка");
//   }
// });

mongoose
  .connect(process.env.MOGO_URI, {})
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`🚀 Сервер запущен на порту ${PORT}`));

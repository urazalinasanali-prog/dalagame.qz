/**
 * Google Apps Script Backend for Registration
 * 
 * Instructions:
 * 1. Open your Google Spreadsheet.
 * 2. Click Extensions -> Apps Script.
 * 3. Replace the code in the editor with this code.
 * 4. Click "Deploy" -> "New Deployment".
 * 5. Select type "Web App".
 * 6. Set "Execute as" to "Me".
 * 7. Set "Who has access" to "Anyone" (CRITICAL for CORS and public access).
 * 8. Copy the Web App URL and paste it into your React code.
 */

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000); // Wait for up to 10 seconds for other processes to finish

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName("Users");
    
    // Create sheet if it doesn't exist
    if (!sheet) {
      sheet = ss.insertSheet("Users");
      sheet.appendRow(["Имя", "Email", "Пароль", "Дата регистрации"]);
      sheet.getRange(1, 1, 1, 4).setFontWeight("bold").setBackground("#f3f3f3");
    }

    const data = JSON.parse(e.postData.contents);
    const { action, name, email, password } = data;

    if (action === "login") {
      if (!email || !password) {
        return createResponse({ status: "error", message: "Email и пароль обязательны" });
      }
      const rows = sheet.getDataRange().getValues();
      const userRow = rows.find(row => row[1] === email && String(row[2]) === String(password));
      
      if (userRow) {
        return createResponse({ 
          status: "success", 
          message: "Вход выполнен!", 
          user: { name: userRow[0], email: userRow[1] } 
        });
      } else {
        return createResponse({ status: "error", message: "Неверный email или пароль" });
      }
    }

    // Default action: register
    if (!name || !email || !password) {
      return createResponse({ status: "error", message: "Все поля обязательны" });
    }

    // Check if email already exists
    const rows = sheet.getDataRange().getValues();
    const emailExists = rows.some(row => row[1] === email);

    if (emailExists) {
      return createResponse({ status: "error", message: "Пользователь с таким email уже существует" });
    }

    // Append new row: Name, Email, Password, Registration Date
    sheet.appendRow([name, email, password, new Date()]);

    return createResponse({ status: "success", message: "Регистрация прошла успешно!" });

  } catch (error) {
    return createResponse({ status: "error", message: "Ошибка сервера: " + error.toString() });
  } finally {
    lock.releaseLock();
  }
}

function createResponse(result) {
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  return createResponse({ status: "success", message: "Скрипт активен" });
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000); // Wait for up to 10 seconds for other processes to finish

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName("Users");
    
    // Create sheet if it doesn't exist
    if (!sheet) {
      sheet = ss.insertSheet("Users");
      sheet.appendRow(["Имя", "Email", "Пароль", "Дата регистрации", "Телефон", "Никнейм", "Роль", "Баланс", "ID"]);
      sheet.getRange(1, 1, 1, 9).setFontWeight("bold").setBackground("#f3f3f3");
    }

    let data;
    try {
      data = JSON.parse(e.postData.contents);
    } catch (err) {
      // Fallback for non-JSON or malformed data
      data = e.parameter;
    }
    
    const { action, name, email, password, phone, nickname, win, winAmount, amount } = data;
    const finalWin = win !== undefined ? win : winAmount;

    if (action === "saveWin") {
      Logger.log('saveWin: email=' + email + ', win=' + win + ', winAmount=' + winAmount + ', gameName=' + data.gameName);
      
      if (!email) {
        return createResponse({ status: "error", message: "Email обязателен" });
      }
      if (finalWin === undefined || finalWin === null) {
        return createResponse({ status: "error", message: "Выигрыш обязателен" });
      }
      
      // Try to find the "Wins" sheet, or the one with ID 1380425053
      let winsSheet = ss.getSheetByName("Wins");
      if (!winsSheet) {
        // Fallback: try to find by ID if it's the one the user provided
        const allSheets = ss.getSheets();
        for (let i = 0; i < allSheets.length; i++) {
          if (allSheets[i].getSheetId() == 1380425053) {
            winsSheet = allSheets[i];
            Logger.log('Found Wins sheet by ID 1380425053');
            break;
          }
        }
      }
      
      if (!winsSheet) {
        Logger.log('Wins sheet not found, creating new one');
        winsSheet = ss.insertSheet("Wins");
        winsSheet.appendRow(["Время", "Аккаунт ID", "Выигрыш"]);
        winsSheet.getRange(1, 1, 1, 3).setFontWeight("bold").setBackground("#f3f3f3");
      }
      
      const gameName = data.gameName || "Игра";
      const formattedDate = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd.MM.yyyy HH:mm:ss");
      
      // Append to Wins sheet
      winsSheet.appendRow([formattedDate, email, gameName]);
      Logger.log('Appended row to Wins sheet');
      
      // Also update user balance
      const rows = sheet.getDataRange().getValues();
      const rowIndex = rows.findIndex(row => row[1] && row[1].toString().trim().toLowerCase() === email.trim().toLowerCase());
      let newBalance;
      if (rowIndex !== -1) {
        const currentBalance = parseFloat(rows[rowIndex][7]) || 0;
        const winAmountNum = parseFloat(finalWin) || 0;
        newBalance = currentBalance + winAmountNum;
        sheet.getRange(rowIndex + 1, 8).setValue(newBalance);
        SpreadsheetApp.flush();
        Logger.log('Updated user balance to: ' + newBalance);
      }
      
      return createResponse({ status: "success", message: "Выигрыш сохранен!", balance: newBalance });
    }

    if (action === "getBalance") {
      if (!email) {
        return createResponse({ status: "error", message: "Email обязателен" });
      }
      const rows = sheet.getDataRange().getValues();
      const userRow = rows.find(row => row[1] && row[1].toString().trim().toLowerCase() === email.trim().toLowerCase());
      if (userRow) {
        const balance = parseFloat(userRow[7]) || 0;
        Logger.log('getBalance for ' + email + ': ' + balance);
        return createResponse({ status: "success", balance: balance });
      }
      return createResponse({ status: "error", message: "Пользователь не найден" });
    }

    if (action === "deductBalance") {
      if (!email || amount === undefined) {
        return createResponse({ status: "error", message: "Email или сумма не переданы" });
      }
      
      const rows = sheet.getDataRange().getValues();
      const rowIndex = rows.findIndex(function(row) { 
        return row[1] && row[1].toString().trim().toLowerCase() === email.trim().toLowerCase(); 
      });
      
      if (rowIndex !== -1) {
        const currentBalance = parseFloat(rows[rowIndex][7]) || 0;
        const deductAmount = parseFloat(amount);
        
        if (currentBalance < deductAmount) {
          return createResponse({ status: "error", message: "Недостаточно средств" });
        }
        
        const newBalance = currentBalance - deductAmount;
        sheet.getRange(rowIndex + 1, 8).setValue(newBalance);
        SpreadsheetApp.flush();
        Logger.log('deductBalance for ' + email + ': ' + newBalance);
        
        return createResponse({ status: "success", balance: newBalance, newBalance: newBalance });
      }
      return createResponse({ status: "error", message: "Пользователь не найден" });
    }

    if (action === "login") {
      if (!email || !password) {
        return createResponse({ status: "error", message: "Email и пароль обязательны" });
      }
      const rows = sheet.getDataRange().getValues();
      const userRow = rows.find(row => row[1] && row[1].toString().trim().toLowerCase() === email.trim().toLowerCase() && String(row[2]) === String(password));
      
      if (userRow) {
        return createResponse({ 
          status: "success", 
          message: "Вход выполнен!", 
          user: { 
            name: userRow[0], 
            email: userRow[1],
            phone: userRow[4],
            nickname: userRow[5],
            role: userRow[6] || "Новичок",
            balance: parseFloat(userRow[7]) || 0,
            id: userRow[8] || ""
          } 
        });
      } else {
        return createResponse({ status: "error", message: "Неверный email или пароль" });
      }
    }

    if (action === "updateProfile") {
      if (!email) {
        return createResponse({ status: "error", message: "Email обязателен" });
      }
      const rows = sheet.getDataRange().getValues();
      const rowIndex = rows.findIndex(row => row[1] && row[1].toString().trim().toLowerCase() === email.trim().toLowerCase());
      
      if (rowIndex !== -1) {
        const { name, nickname, phone, password, newPassword } = data;
        
        if (newPassword) {
          if (String(rows[rowIndex][2]) !== String(password)) {
            return createResponse({ status: "error", message: "Неверный текущий пароль" });
          }
          sheet.getRange(rowIndex + 1, 3).setValue(newPassword);
        }
        
        if (name) sheet.getRange(rowIndex + 1, 1).setValue(name);
        if (phone) sheet.getRange(rowIndex + 1, 5).setValue(phone);
        if (nickname) sheet.getRange(rowIndex + 1, 6).setValue(nickname);
        
        SpreadsheetApp.flush();
        return createResponse({ status: "success", message: "Профиль обновлен!" });
      } else {
        return createResponse({ status: "error", message: "Пользователь не найден" });
      }
    }

    // Default action: register
    if (!name || !email || !password || !phone || !nickname) {
      return createResponse({ status: "error", message: "Все поля обязательны" });
    }

    // Check if email already exists
    const rows = sheet.getDataRange().getValues();
    const emailExists = rows.some(row => row[1] && row[1].toString().trim().toLowerCase() === email.trim().toLowerCase());

    if (emailExists) {
      return createResponse({ status: "error", message: "Пользователь с таким email уже существует" });
    }

    // Use ID from frontend if available, otherwise generate one
    const userId = data.id || ("DG-" + Math.floor(100000 + Math.random() * 900000));

    // Append new row: Name, Email, Password, Registration Date, Phone, Nickname, Role, Balance, ID
    sheet.appendRow([name, email, password, new Date(), phone, nickname, "Новичок", 20000, userId]);
    SpreadsheetApp.flush();

    return createResponse({ 
      status: "success", 
      message: "Регистрация прошла успешно!",
      user: {
        name,
        email,
        phone,
        nickname,
        role: "Новичок",
        balance: 20000,
        id: userId
      }
    });

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

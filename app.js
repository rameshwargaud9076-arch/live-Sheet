/* =====================================================
   GOOGLE SHEET DASHBOARD API
   COMPLETE CODE.GS
===================================================== */

const SPREADSHEET_ID =
  "1Vrcd5hvHrTUcm8YT6jH6jHn_6cT4Vw1bHfPoPB-x_dQ";


/* =====================================================
   GET REQUEST
===================================================== */

function doGet(e) {

  try {

    const action =
      e && e.parameter && e.parameter.action
        ? e.parameter.action
        : "sheets";


    /* =========================
       GET ALL SHEETS
    ========================= */

    if (action === "sheets") {

      return jsonResponse(
        getSheets()
      );

    }


    /* =========================
       GET SHEET DATA
    ========================= */

    if (action === "data") {

      const gid =
        e.parameter.gid;


      if (!gid) {

        throw new Error(
          "gid missing"
        );

      }


      return jsonResponse(
        getSheetData(gid)
      );

    }


    throw new Error(
      "Invalid action"
    );

  }

  catch (error) {

    return jsonResponse({

      success: false,

      error:
        error && error.message
          ? error.message
          : String(error)

    });

  }

}


/* =====================================================
   GET ALL SHEETS
===================================================== */

function getSheets() {

  const spreadsheet =
    SpreadsheetApp.openById(
      SPREADSHEET_ID
    );


  const sheets =
    spreadsheet.getSheets();


  const result =
    sheets.map(function(sheet) {

      return {

        gid:
          String(
            sheet.getSheetId()
          ),

        name:
          sheet.getName()

      };

    });


  return {

    success: true,

    sheets: result

  };

}


/* =====================================================
   GET SHEET DATA
===================================================== */

function getSheetData(gid) {

  const spreadsheet =
    SpreadsheetApp.openById(
      SPREADSHEET_ID
    );


  const sheets =
    spreadsheet.getSheets();


  let targetSheet = null;


  for (
    let i = 0;
    i < sheets.length;
    i++
  ) {

    if (
      String(
        sheets[i].getSheetId()
      ) === String(gid)
    ) {

      targetSheet =
        sheets[i];

      break;

    }

  }


  if (!targetSheet) {

    throw new Error(
      "Sheet not found: " + gid
    );

  }


  const lastRow =
    targetSheet.getLastRow();


  const lastColumn =
    targetSheet.getLastColumn();


  /* =========================
     EMPTY SHEET
  ========================= */

  if (
    lastRow === 0 ||
    lastColumn === 0
  ) {

    return {

      success: true,

      gid: String(gid),

      name:
        targetSheet.getName(),

      headers: [],

      rows: []

    };

  }


  /* =========================
     READ SHEET
  ========================= */

  const values =
    targetSheet
      .getRange(
        1,
        1,
        lastRow,
        lastColumn
      )
      .getDisplayValues();


  if (!values.length) {

    return {

      success: true,

      gid: String(gid),

      name:
        targetSheet.getName(),

      headers: [],

      rows: []

    };

  }


  /* =========================
     FIRST ROW = HEADERS
  ========================= */

  const headers =
    values[0].map(function(header) {

      return String(
        header || ""
      ).trim();

    });


  const rows = [];


  /* =========================
     DATA ROWS
  ========================= */

  for (
    let i = 1;
    i < values.length;
    i++
  ) {

    const row =
      values[i];


    const hasData =
      row.some(function(value) {

        return String(
          value || ""
        ).trim() !== "";

      });


    if (!hasData) {

      continue;

    }


    const object = {};


    headers.forEach(
      function(header, index) {

        object[header] =
          String(
            row[index] || ""
          ).trim();

      }
    );


    rows.push(object);

  }


  return {

    success: true,

    gid: String(gid),

    name:
      targetSheet.getName(),

    headers: headers,

    rows: rows

  };

}


/* =====================================================
   JSON RESPONSE
===================================================== */

function jsonResponse(data) {

  return ContentService

    .createTextOutput(
      JSON.stringify(data)
    )

    .setMimeType(
      ContentService.MimeType.JSON
    );

}
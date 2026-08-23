/* =====================================================
   GOOGLE SHEET DASHBOARD
   COMPLETE APP.JS
===================================================== */


/* =====================================================
   CONFIG
===================================================== */

const API_URL =
    "https://script.google.com/macros/s/AKfycbye8ndlLkeJCLXRygIhVwa6Hpa1crWBVXRdBVZkLY1V6tYv-TzVhgpM0mQPfiG4wRtyiw/exec";


const SHEET_ID =
    "1Vrcd5hvHrTUcm8YT6jH6jHn_6cT4Vw1bHfPoPB-x_dQ";


const ROWS_PER_PAGE = 25;


/* =====================================================
   DASHBOARD HIDDEN COLUMNS
===================================================== */

const HIDDEN_DASHBOARD_COLUMNS = [
    "sr no",
    "srno",
    "serial no",
    "serial number"
];


/* =====================================================
   GLOBAL VARIABLES
===================================================== */

let allSheets = [];

let currentSheet = null;

let sheetHeaders = [];

let sheetRows = [];

let filteredRows = [];

let currentPage = 1;


/* =====================================================
   DOM ELEMENTS
===================================================== */

const statsContainer =
    document.getElementById("statsContainer");

const totalRecordsElement =
    document.getElementById("totalRecords");

const tableHead =
    document.getElementById("tableHead");

const tableBody =
    document.getElementById("tableBody");

const allTableHead =
    document.getElementById("allTableHead");

const allTableBody =
    document.getElementById("allTableBody");

const pagination =
    document.getElementById("pagination");

const searchInput =
    document.getElementById("searchInput");

const columnFilter =
    document.getElementById("columnFilter");

const clearSearch =
    document.getElementById("clearSearch");

const refreshButton =
    document.getElementById("refreshButton");

const connectionStatus =
    document.getElementById("connectionStatus");

const lastUpdated =
    document.getElementById("lastUpdated");

const recordCount =
    document.getElementById("recordCount");

const allRecordCount =
    document.getElementById("allRecordCount");

const columnCards =
    document.getElementById("columnCards");

const sheetTabs =
    document.getElementById("sheetTabs");

const currentSheetName =
    document.getElementById("currentSheetName");

const currentSheetRows =
    document.getElementById("currentSheetRows");

const connectionDot =
    document.getElementById("connectionDot");

const connectionText =
    document.getElementById("connectionText");


/* =====================================================
   CLEAN VALUE
===================================================== */

function cleanValue(value) {

    return String(value ?? "").trim();

}


/* =====================================================
   ESCAPE HTML
===================================================== */

function escapeHTML(value) {

    return String(value ?? "")

        .replace(/&/g, "&amp;")

        .replace(/</g, "&lt;")

        .replace(/>/g, "&gt;")

        .replace(/"/g, "&quot;")

        .replace(/'/g, "&#039;");

}


/* =====================================================
   NORMALIZE HEADER
===================================================== */

function normalizeHeader(value) {

    return cleanValue(value)
        .toLowerCase()
        .replace(/\s+/g, " ");

}


/* =====================================================
   HIDDEN COLUMN CHECK
===================================================== */

function isHiddenDashboardColumn(header) {

    return HIDDEN_DASHBOARD_COLUMNS.includes(
        normalizeHeader(header)
    );

}


/* =====================================================
   STATUS
===================================================== */

function setStatus(type, text) {

    connectionStatus.className =
        "status " + type;

    connectionStatus.innerHTML = `
        <span></span>
        ${escapeHTML(text)}
    `;


    connectionDot.className =
        "connection-dot";


    if (type === "live") {

        connectionDot.classList.add("live");

    }


    if (type === "error") {

        connectionDot.classList.add("error");

    }


    connectionText.textContent =
        text;

}


/* =====================================================
   API REQUEST
===================================================== */

async function apiRequest(action, gid = "") {

    let url =
        API_URL +
        "?action=" +
        encodeURIComponent(action);


    if (gid !== "") {

        url +=
            "&gid=" +
            encodeURIComponent(gid);

    }


    url +=
        "&t=" +
        Date.now();


    const response =
        await fetch(url, {
            method: "GET",
            cache: "no-store"
        });


    if (!response.ok) {

        throw new Error(
            "Server response error: " +
            response.status
        );

    }


    const data =
        await response.json();


    if (data.success === false) {

        throw new Error(
            data.error ||
            "Google Sheet error"
        );

    }


    return data;

}


/* =====================================================
   LOAD ALL SHEETS
===================================================== */

async function loadSheetList() {

    setStatus(
        "connecting",
        "Loading sheets..."
    );


    const data =
        await apiRequest("sheets");


    allSheets =
        Array.isArray(data.sheets)
            ? data.sheets
            : [];


    renderSheetTabs();


    if (allSheets.length === 0) {

        throw new Error(
            "Google Sheet me koi sheet/tab nahi mila."
        );

    }


    /*
       Previous selected sheet
    */

    const savedGid =
        localStorage.getItem(
            "selectedSheetGid"
        );


    let selectedSheet =
        allSheets.find(
            sheet =>
                String(sheet.gid) ===
                String(savedGid)
        );


    /*
       Agar saved sheet nahi mili
       to first sheet select hogi.
    */

    if (!selectedSheet) {

        selectedSheet =
            allSheets[0];

    }


    await selectSheet(
        selectedSheet
    );

}


/* =====================================================
   RENDER SHEET TABS
===================================================== */

function renderSheetTabs() {

    sheetTabs.innerHTML = "";


    allSheets.forEach(sheet => {

        const button =
            document.createElement("button");


        button.className =
            "sheet-tab";


        if (
            currentSheet &&
            String(currentSheet.gid) ===
            String(sheet.gid)
        ) {

            button.classList.add("active");

        }


        button.innerHTML = `
            <span class="sheet-tab-icon">
                <i class="fa-solid fa-table"></i>
            </span>

            <span>
                ${escapeHTML(sheet.name)}
            </span>
        `;


        button.addEventListener(
            "click",
            () => selectSheet(sheet)
        );


        sheetTabs.appendChild(button);

    });

}


/* =====================================================
   LOAD SELECTED SHEET DATA
===================================================== */

async function loadSheet(sheet) {

    setStatus(
        "connecting",
        "Loading " + sheet.name
    );


    const data =
        await apiRequest(
            "data",
            sheet.gid
        );


    sheetHeaders =
        Array.isArray(data.headers)
            ? data.headers
            : [];


    sheetRows =
        Array.isArray(data.rows)
            ? data.rows
            : [];


    filteredRows =
        [...sheetRows];


    currentPage = 1;


    renderCurrentSheet();


    setStatus(
        "live",
        "Google Sheet Live"
    );


    lastUpdated.textContent =
        "Updated: " +
        new Date().toLocaleString("en-IN");

}


/* =====================================================
   SELECT SHEET
===================================================== */

async function selectSheet(sheet) {

    currentSheet =
        sheet;


    currentSheetName.textContent =
        sheet.name;


    renderSheetTabs();


    localStorage.setItem(
        "selectedSheetGid",
        String(sheet.gid)
    );


    tableBody.innerHTML = `
        <tr>
            <td colspan="100" class="loading-row">
                <i class="fa-solid fa-spinner fa-spin"></i>
                Loading ${escapeHTML(sheet.name)}...
            </td>
        </tr>
    `;


    try {

        await loadSheet(sheet);

    }

    catch (error) {

        console.error(error);


        setStatus(
            "error",
            "Load Failed"
        );


        tableBody.innerHTML = `
            <tr>
                <td colspan="100" class="error-row">
                    ${escapeHTML(error.message)}
                </td>
            </tr>
        `;

    }

}


/* =====================================================
   RENDER CURRENT SHEET
===================================================== */

function renderCurrentSheet() {

    totalRecordsElement.textContent =
        sheetRows.length;


    currentSheetRows.textContent =
        sheetRows.length +
        " Records";


    createTableHeader(
        tableHead
    );


    createTableHeader(
        allTableHead
    );


    renderColumnFilter();

    renderStats();

    renderColumnCards();

    renderMainTable();

    renderAllRecords();

}


/* =====================================================
   CREATE TABLE HEADER
===================================================== */

function createTableHeader(target) {

    target.innerHTML = `
        <tr>
            <th>#</th>

            ${sheetHeaders.map(
                header => `
                    <th>
                        ${escapeHTML(header)}
                    </th>
                `
            ).join("")}
        </tr>
    `;

}


/* =====================================================
   CREATE TABLE ROW
===================================================== */

function createTableRow(row, number) {

    let html = `
        <tr>
            <td class="serial-value">
                ${number}
            </td>
    `;


    sheetHeaders.forEach(header => {

        const value =
            cleanValue(row[header]);


        html += `
            <td class="${value ? "" : "empty-cell"}">
                ${
                    value
                        ? escapeHTML(value)
                        : "—"
                }
            </td>
        `;

    });


    html += `
        </tr>
    `;


    return html;

}


/* =====================================================
   FILTER DATA
===================================================== */

function filterData() {

    const search =
        cleanValue(
            searchInput.value
        ).toLowerCase();


    const selectedColumn =
        columnFilter.value;


    filteredRows =
        sheetRows.filter(row => {

            if (search === "") {

                return true;

            }


            if (selectedColumn === "all") {

                return sheetHeaders.some(
                    header =>
                        cleanValue(
                            row[header]
                        )
                            .toLowerCase()
                            .includes(search)
                );

            }


            return cleanValue(
                row[selectedColumn]
            )
                .toLowerCase()
                .includes(search);

        });


    currentPage = 1;


    renderMainTable();

}


/* =====================================================
   RENDER MAIN TABLE
===================================================== */

function renderMainTable() {

    const total =
        filteredRows.length;


    const totalPages =
        Math.max(
            1,
            Math.ceil(
                total /
                ROWS_PER_PAGE
            )
        );


    if (currentPage > totalPages) {

        currentPage =
            totalPages;

    }


    const start =
        (currentPage - 1) *
        ROWS_PER_PAGE;


    const pageRows =
        filteredRows.slice(
            start,
            start + ROWS_PER_PAGE
        );


    if (pageRows.length === 0) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="100" class="loading-row">
                    No records found.
                </td>
            </tr>
        `;

    }

    else {

        tableBody.innerHTML =
            pageRows
                .map(
                    (row, index) =>
                        createTableRow(
                            row,
                            start + index + 1
                        )
                )
                .join("");

    }


    recordCount.textContent =
        total + " Records";


    renderPagination(
        totalPages
    );

}


/* =====================================================
   RENDER ALL RECORDS
===================================================== */

function renderAllRecords() {

    allTableHead.innerHTML = "";

    allTableBody.innerHTML = "";


    createTableHeader(
        allTableHead
    );


    if (sheetRows.length === 0) {

        allTableBody.innerHTML = `
            <tr>
                <td colspan="100" class="loading-row">
                    No records found.
                </td>
            </tr>
        `;

    }

    else {

        allTableBody.innerHTML =
            sheetRows
                .map(
                    (row, index) =>
                        createTableRow(
                            row,
                            index + 1
                        )
                )
                .join("");

    }


    allRecordCount.textContent =
        sheetRows.length +
        " Records";

}


/* =====================================================
   PAGINATION
===================================================== */

function renderPagination(totalPages) {

    pagination.innerHTML = "";


    if (totalPages <= 1) {

        return;

    }


    const previous =
        document.createElement("button");


    previous.className =
        "page-button";


    previous.innerHTML = "‹";


    previous.disabled =
        currentPage === 1;


    previous.onclick = () => {

        if (currentPage > 1) {

            currentPage--;

            renderMainTable();

        }

    };


    pagination.appendChild(
        previous
    );


    /*
       Page buttons
    */

    const maxButtons = 7;

    let startPage =
        Math.max(
            1,
            currentPage -
            Math.floor(maxButtons / 2)
        );


    let endPage =
        Math.min(
            totalPages,
            startPage +
            maxButtons -
            1
        );


    if (
        endPage - startPage + 1 <
        maxButtons
    ) {

        startPage =
            Math.max(
                1,
                endPage -
                maxButtons +
                1
            );

    }


    for (
        let i = startPage;
        i <= endPage;
        i++
    ) {

        const button =
            document.createElement("button");


        button.className =
            "page-button";


        if (i === currentPage) {

            button.classList.add(
                "active"
            );

        }


        button.textContent =
            i;


        button.onclick = () => {

            currentPage = i;

            renderMainTable();

        };


        pagination.appendChild(
            button
        );

    }


    const next =
        document.createElement("button");


    next.className =
        "page-button";


    next.innerHTML = "›";


    next.disabled =
        currentPage === totalPages;


    next.onclick = () => {

        if (
            currentPage <
            totalPages
        ) {

            currentPage++;

            renderMainTable();

        }

    };


    pagination.appendChild(
        next
    );

}


/* =====================================================
   COLUMN FILTER
===================================================== */

function renderColumnFilter() {

    columnFilter.innerHTML = `
        <option value="all">
            All Columns
        </option>
    `;


    sheetHeaders.forEach(header => {

        const option =
            document.createElement("option");


        option.value =
            header;


        option.textContent =
            header;


        columnFilter.appendChild(
            option
        );

    });

}


/* =====================================================
   DASHBOARD STATS
===================================================== */

function renderStats() {

    /*
       Existing total card ko rakho.
       Dynamic cards ko remove karo.
    */

    const cards =
        statsContainer.querySelectorAll(
            ".stat-card"
        );


    cards.forEach(
        (card, index) => {

            if (index > 0) {

                card.remove();

            }

        }
    );


    sheetHeaders.forEach(header => {

        if (
            isHiddenDashboardColumn(
                header
            )
        ) {

            return;

        }


        const filledCount =
            sheetRows.filter(
                row =>
                    cleanValue(
                        row[header]
                    ) !== ""
            ).length;


        const card =
            document.createElement(
                "div"
            );


        card.className =
            "stat-card";


        card.innerHTML = `
            <div class="stat-label">
                ${escapeHTML(header)}
            </div>

            <div class="stat-number">
                ${filledCount}
            </div>

            <div class="stat-description">
                Filled records
            </div>
        `;


        statsContainer.appendChild(
            card
        );

    });

}


/* =====================================================
   COLUMN CARDS
===================================================== */

function renderColumnCards() {

    columnCards.innerHTML = "";


    if (sheetHeaders.length === 0) {

        columnCards.innerHTML = `
            <div class="loading-row">
                No columns found.
            </div>
        `;

        return;

    }


    sheetHeaders.forEach(
        (header, index) => {

            const filledCount =
                sheetRows.filter(
                    row =>
                        cleanValue(
                            row[header]
                        ) !== ""
                ).length;


            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "column-card";


            card.innerHTML = `
                <div class="column-card-icon">
                    <i class="fa-solid fa-table-columns"></i>
                </div>

                <h3>
                    ${escapeHTML(header)}
                </h3>

                <div class="column-card-count">
                    ${filledCount}
                </div>

                <small>
                    ${sheetRows.length} total records
                </small>
            `;


            columnCards.appendChild(
                card
            );

        }
    );

}


/* =====================================================
   NAVIGATION
===================================================== */

function setupNavigation() {

    const navItems =
        document.querySelectorAll(
            ".nav-item"
        );


    const views =
        document.querySelectorAll(
            ".view"
        );


    const pageTitle =
        document.getElementById(
            "pageTitle"
        );


 
/**
 * Free alternative to Zapier-WooCommerce integration. This Google App Script saves the new WooCommerce orders
 * in a general spreadsheet (the one where the script is applied), as well as in separated spreadsheets, one
 * for each different order´s type.
 *
 * For example, if you have two types of orders: Shirt and Jeans. It will create a spreadsheet with all the data
 * of the people that ordered a Shirt and another for everyone that ordered Jeans. Besides, there will be a general
 * Spreadsheet with all the orders together.
 *
 * By Ángel Igareta. I would appreciate a star: https://github.com/angeligareta/WooCommerce2GoogleSeets
 */

/**
 * CONSTANTS PRIVATES FOR EACH WEBPAGE.
 */
var WEBSITE = "WEBSITE_LINK";
var CK = "GET_CK_WOOCOMMERCE"; // Get it from WooCommerce -> Settings -> Advanced Settings -> Rest API
var CS = "GET_CS_WOOCOMMERCE"; // Get it from WooCommerce -> Settings -> Advanced Settings -> Rest API

var ACTIVITY_FOLDER_ID = "ACTIVITY_FOLDER_ID"; // Where you want to upload the activity spreadsheets.
var TITLES = ["First Name", "Last Name", "Email", "Status", "Notes", "Quantity", "Total"]; // Title of the spreadsheets.

/**
 * Method that fires when the webapp receives a GET request
 */
function doGet(e) {
  syncOrders();
  return HtmlService.createHtmlOutput("Request received");
}

/**
 * Method that fires when the webapp receives a POST request
 */
function doPost(e) {
  syncOrders();
  return HtmlService.createHtmlOutput("Post request received");
}

/**
 * Trigger function for starting the sync process to check new orders from WooCommerce.
 */
function syncOrders() {
    var sheetName = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet().getName();
    fetchOrders(sheetName)
}

/**
 * Method that fetch the orders in WooCommerce newer than the yesterday. For each order, it checks all the items
 * that were bought and write the order´s relevant data in separated spreadsheets, each one representing one
 * different item´s category.
 *
 * If it is the first time ordering for an activity, it creates a new spreadsheet with the name of the acitivity
 * in a custom activity folder, its ID is represented by ACTIVITY_FOLDER_ID.
 */
function fetchOrders(sheetName) {

    var yesterdayDate = new Date(Date.now() - 864e5).toISOString(); // 864e5 == 86400000 == 24*60*60*1000
    var url = WEBSITE + "/wp-json/wc/v2/orders?consumer_key=" + CK + "&consumer_secret=" + CS + "&after=" + yesterdayDate + "&per_page=100";
    var options = {
        "method": "GET",
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        "muteHttpExceptions": true
    };

    var result = UrlFetchApp.fetch(url, options);
    // Logger.log(result.getResponseCode())

    var orderList = {};
    if (result.getResponseCode() == 200) {
        orderList = JSON.parse(result.getContentText());
        // Logger.log(orderList);
    }

    for (var i = 0; i < orderList.length; i++) {
        var itemsList, refundList;
        var orderDataRow = [];

        orderDataRow.push(orderList[i]["billing"]["first_name"]);
        orderDataRow.push(orderList[i]["billing"]["last_name"]);
        orderDataRow.push(orderList[i]["billing"]["email"]);
        orderDataRow.push(orderList[i]["status"]);
        orderDataRow.push(orderList[i]["customer_note"]);

        // Item List
        itemsList = orderList[i]["line_items"].length;

        var items = "";
        for (var k = 0; k < itemsList; k++) {
            var itemName = orderList[i]["line_items"][k]["name"]
            var quantity = orderList[i]["line_items"][k]["quantity"];
            items += quantity + " x " + itemName + "\n";

            var localOrderDataRow = orderDataRow.slice();
            localOrderDataRow.push(quantity);
            localOrderDataRow.push(orderList[i]["line_items"][k]["total"]);

            var doc = SpreadsheetApp.openById(getCreateDocumentID(itemName)).getActiveSheet();
            doc.appendRow(localOrderDataRow);
            removeDuplicates(doc);
        }

        order = orderDataRow.push(items);

        var doc = SpreadsheetApp.getActiveSpreadsheet();
        var generalDocument = doc.getSheetByName(sheetName);
        generalDocument.appendRow(orderDataRow);

        removeDuplicates(generalDocument);
    }
}

/**
 * Method that removes duplicates from a sheet received by argument.
 */
function removeDuplicates(sheet) { // SpreadsheetApp.spreadsheet.sheet
    var data = sheet.getDataRange().getValues();
    var newData = [];

    for (i in data) {
        var row = data[i];
        var duplicate = false;
        for (j in newData) {
            if (row.join() == newData[j].join()) {
                duplicate = true;
            }
        }
        if (!duplicate) {
            newData.push(row);
        }
    }

    sheet.clearContents();
    sheet.getRange(1, 1, newData.length, newData[0].length).setValues(newData);
}

/**
 * Method that checks if the documentName exists in the drive. If it does, return it.
 * If not, create it in the activities´ folder, initialize it and return it.
 */
function getCreateDocumentID(docName) {
    var docID;
    var files = DriveApp.searchFiles('title = "' + docName + '"');

    // If the file does not exist, it creates one in the folder of activities and
    // includes the first row with the titles.
    if (!files.hasNext()) {
        var folder = DriveApp.getFolderById(ACTIVITY_FOLDER_ID);
        var spreadSheet = SpreadsheetApp.create(docName);
        doc = DriveApp.getFileById(spreadSheet.getId());
        DriveApp.getRootFolder().removeFile(doc);

        folder.addFile(doc);
        docID = DriveApp.searchFiles('title = "' + docName + '"').next().getId();
        var doc = SpreadsheetApp.openById(docID).getActiveSheet();
        doc.appendRow(TITLES);
        
        // Customizing row
        doc.getRange(1, 1, 1, 7).setBackground("#4a86e8");
        doc.getRange(1, 1, 1, 7).setFontColor("white");
        doc.getRange(1, 1, 1, 7).setFontWeight("bold");
    } else { // If it exists, return it, ONLY ONE POSSIBLE!
        docID = files.next().getId();
    }

    return docID;
}

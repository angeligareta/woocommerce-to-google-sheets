# WooCommerce2GoogleSeets

## Abstract
Free alternative to Zapier-WooCommerce integration. This Google App Script stores the newest WooCommerce orders in a general spreadsheet (the one where the script is applied), as well as in separated spreadsheets, one for each different order´s type.

For example, if you have two types of orders: Shirt and Jeans. It will create a spreadsheet with all the data of the people that ordered a Shirt and another for everyone that ordered Jeans. Besides, there will be a general Spreadsheet with all the orders together.

And there is more, these spreadsheets will be updated each hour! Do you want to implement it? Piece of cake! Just follow two steps:

## Installation
### Create Spreadsheet
Create a spreadsheet in Google Sheets, where you want the general spreadsheet (where all the order will be mixed). Here, you must add one row of data with the following titles:
> First Name	| Last Name |	Email	| Notes |	Order status | Order

From within the new spreadsheet, select the menu item Tools > Script editor. If you are presented with a welcome screen, click Blank Project. Delete any code in the script editor and paste the code that you can find in googleAppsScript.js in it. However, you must fill WEBSITE, CK, CS and ACTIVITY_FOLDER_ID with the correct values.

Once you have done that, you can go to the menu item Execute -> Execute Function -> syncOrders. And magic! The general spreadsheet and the activities one will be filled and created.

### Auto Triggering
If you want to trigger syncOrders automatically, in the Script editor go to the menu item Edit -> Current Projects Trigger. Add one, with the function syncOrders and the source time, selecting the respective frequency.

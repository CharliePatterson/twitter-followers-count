/**
* @desc This is a Google Script to get the Twitter follower numbers 
* for selected Twitter handles in a Google Sheet. The follower numbers 
* are outputted in a new tab of the same Google Sheet.
*/

/**
* Define config object with configuration variables
*/
var config = {
    twitter: {
      oathService: {
        consumerKey: '##############', /* ###replace_with_your_consumer_key### */
        consumerSecret: '##############' /* ###replace_with_your_consumer_secret###  */
      },
      custom: {
        twitterApiCallLimit: 100,
        twitterUnameMaxLength: 15
      }
    },
    errorMessages: {
      error1: "ERROR1: Username invalid or not reconised. Username should be less than 15 characters and contain only letters, numbers of underscores with no spaces."
    }
  };


/**
* Runs automatically when a user installs an add-on
*
* @param {Object} e
*/
function onInstall(e) {
  onOpen(e);
}

/**
* Runs automatically when a user opens a spreadsheet
*
* @param {Object} e
*/
function onOpen(e) {
  var menu = SpreadsheetApp.getUi().createAddonMenu();
  menu.addItem('Get Twitter Followers', 'writeOutput');
  menu.addToUi();
}


/**
* returns html output from file passed as paramater
*
* @param {String} filename
*/
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename)
  .getContent(); 
}

/**
* Prints message to the screen
*
* @param {String} msg
*/
function printUserMessage(msg) {
  var ui = SpreadsheetApp.getUi();
  ui.alert(msg); 
}


/**
* Gets user selected data from sheet and converts
* to array to be sent to API
*
* @return {array} data
*/
function getUserInput() {
  var range = SpreadsheetApp.getActiveRange();
  var data = range.getValues();
  /*create api array from input*/  
  var apiLimit = 100;
  
  data = convertTwoToOneDimArray(data);
  /*filter empty elements*/
  data = data.filter(isNotEmpty);
  var twitterinput = createTwitterApiArray(data);
  return twitterinput;
}

/**
* Puts user name and follower number 
* in object for output
*
* @param {array} twitterData
* @return {array} output
*/
function getFollowers(twitterData) {

  var user, i, j, output;
  
  output = [];
  
   for (i = 0; i < twitterData.length; i = i + 1) {
     user = twitterData[i];   
     output[i] = [user.screen_name, user.followers_count];
   }
  Logger.log(output);
  return output;
}

/**
* Get data from Twitter API
*
* @param {array} userNameArray
* @return {array} output
*/
function getTwitterData(userNameArray) {
  
  var options, url, response, output;  
  /*Utilities.sleep creates pause in program execution to avoid overloading Twitter API
  More info https://dev.twitter.com/docs/rate-limiting/1.1 */
  Utilities.sleep(1000);  
  /* "twitter" value must match the argument to "addOAuthService" above. */
  options = {
    'oAuthServiceName' : 'twitter',
    'oAuthUseToken' : 'always'
  };  
  var twitterService = getTwitterService();
 
  if (!twitterService.hasAccess()) {
    var authorizationUrl = twitterService.authorize();
    var template = HtmlService.createTemplate(
        '<a href="<?= authorizationUrl ?>" target="_blank">Authorize</a>. ' +
        'Reopen the sidebar when the authorization is complete.');
    template.authorizationUrl = authorizationUrl;
    var page = template.evaluate();
      var ui = SpreadsheetApp.getUi().showModalDialog(page, 'Authorise app');
}
  /*get Twitter user data*/
  url = 'https://api.twitter.com/1.1/users/lookup.json?screen_name='+userNameArray;  
  response = twitterService.fetch(url, options);
  output = JSON.parse(response.getContentText());  
  return output;

}

/**
* Create the OAuth1 service
*
* @source https://github.com/googlesamples/apps-script-oauth1
*/
function getTwitterService() {
  
    var consumerKey, consumerSecret, oauthConfig, options, url, response, output;
  /*set configuraton for Twitter OAuth service*/
  consumerKey = config.twitter.oathService.consumerKey;
  consumerSecret = config.twitter.oathService.consumerSecret;

  return OAuth1.createService('twitter')
      // Set the endpoint URLs.
      .setAccessTokenUrl('https://api.twitter.com/oauth/access_token')
      .setRequestTokenUrl('https://api.twitter.com/oauth/request_token')
      .setAuthorizationUrl('https://api.twitter.com/oauth/authorize')

      // Set the consumer key and secret.
      .setConsumerKey(consumerKey)
      .setConsumerSecret(consumerSecret)

      // Set the name of the callback function in the script referenced
      // above that should be invoked to complete the OAuth flow.
      .setCallbackFunction('authCallback')

      // Set the property store where authorized tokens should be persisted.
      .setPropertyStore(PropertiesService.getUserProperties());
  
}

/**
* Handle the callback
*
* @source https://github.com/googlesamples/apps-script-oauth1
*/
function authCallback(request) {
  var twitterService = getTwitterService();
  var isAuthorized = twitterService.handleCallback(request);
  if (isAuthorized) {
    return HtmlService.createHtmlOutput('Success! You can close this tab.');
  } else {
    return HtmlService.createHtmlOutput('Denied. You can close this tab');
  }
}


/**
* @desc Creates an array or multidimensional array based on length of twitterApiCallLimit
* @param filteredTwitterHandles (array)
* @return inputArray (array)
*/
function createTwitterApiArray(filteredTwitterHandles) {
  "use strict";
  var twitterApiCallLimit, inputArray, arrayLength, numLoops, arrayCount, m, x;
  twitterApiCallLimit = config.twitter.custom.twitterApiCallLimit; 
  inputArray = [];
  arrayLength = filteredTwitterHandles.length;
  numLoops = arrayLength / twitterApiCallLimit; 
  arrayCount = 0;
  for (m = 0; m < numLoops; m = m + 1) {   
    inputArray[m] = [];
    arrayLength = filteredTwitterHandles.length;    
    for (x = 0; arrayCount < arrayLength; x = x + 1) {      
      inputArray[m][x] = filteredTwitterHandles[arrayCount];
      arrayCount = arrayCount + 1;      
      //restart loop if api call limit reached
      if (x === twitterApiCallLimit) {        
        arrayLength = 0;        
      }
    }
  }
  
  return inputArray;
  
}

/*
* checks to see if parameter is an empty string
*
* @param {String} e
*
* @return {boolean}
*/
function isNotEmpty(e) {
  if (e == '') {
    return false;
  } else {
    return true; 
  }
}

/**
* Writes data retrieved from API to dialogue box
*
*/
function writeOutput() {
  
  /*get input*/
  try {
    var input = getUserInput();
  }
  catch(e) {
    printUserMessage("Error: could not get data from the sheet. Please try again.");
  }
  /*if user input is empty*/
  if (input.length < 1) {
    printUserMessage("Error: please select at least one cell with data");
  } else {
    
    /*get output */
    
   var twitterData = getTwitterData(input);
  
    var output = getFollowers(twitterData);

    Logger.log(output);
    
    /*add headers*/
    var headers = ['Twitter handle', 'Followers'];
    output.unshift(headers);

    //write output
    try {
      //create timestamp
      var d = new Date();
      var day = d.getDate();
      var month = d.getMonth() + 1; //+1 because starts at 0
      var year = d.getFullYear();
      var hour = d.getHours(); 
      var min = d.getMinutes();
      var sec = d.getSeconds();
      var timestamp = day +":"+ month +":"+ year +" | "+ hour +":"+ min +":"+ sec;
      //write to new sheet
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      ss.insertSheet("Twitter followers: " + timestamp);
      var sheet = ss.getActiveSheet();
      
      var outputRange = sheet.getRange(1, 1, output.length, 2);
      
      outputRange.setValues(output);
      
    }
    catch(e) {
      printUserMessage("Error: could not print results. Please try again." + e);
    }  
  }
}


/**
* Converts a two dimensional array to a one dimensional array
*
* @param {Array} twoDimArray
*
* @return {Array} oneDimArray
*/
function convertTwoToOneDimArray(twoDimArray) {
  "use strict";
  var oneDimArray, outputArrayCount, i, k, j, m;
  oneDimArray = [];
  outputArrayCount = 0;
  for (i = 0, k = twoDimArray.length; i < k; i = i + 1) {
    
    for (j = 0, m = twoDimArray[i].length; j < m; j = j + 1)
    {
      
      oneDimArray[outputArrayCount] = twoDimArray[i][j];
      outputArrayCount = outputArrayCount + 1;
      
    }
  }
  
  return oneDimArray;
  
}

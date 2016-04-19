This is a Google Script to get the Twitter follower numbers for selected Twitter handles in a Google Sheet. The follower numbers are outputted in a new tab of the same Google Sheet.

## Installation

This script is set up as a Google Script addon but isn't deployed, which makes the process of running it a little involved...

You'll need to set this up as a standalone Google Script in Google Drive as then test it as an add-on to actually run the script:

1. Create new blank Google script in Google Drive (not as part of a spreadsheet but standalone)
2. Paste the above code into the script and save it
3. Replace '##############' in the config object with your consumer key and consumer secret (lines 13-14) from https://apps.twitter.com/
4. Add the OAuth1 library as explained in the "Setup" section here https://github.com/googlesamples/apps-script-oauth1

Test as addon:

5. click Publish >> Test as addon
6. Create a new test: select "Test with latest code", "Installed and enabled" and then for "Select doc" choose a Google Sheet file
7. Click Save and then select the test you just created and click "Test"

You'll be redirected to the selected Google Sheet where you can run the addon:

8. Select the cells with the Twitter handles in
9. Click Addons >> [name you gave the code file] >> Get Twitter Followers
10. Authorise the app with Google
11. Login to Twitter when redirected to authorise there
12. ... finally, go back and select the cells with the Twitter handles in again
13. Click Addons >> [name you gave the code file] >> Get Twitter Followers
14. The data for the Twitter followers will be published in a new tab in the same sheet!

## Licensing
  
Please see the file called LICENSE.
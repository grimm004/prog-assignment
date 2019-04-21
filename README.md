# ProgNodeChat

*ProgNodeChat* is a simple chat client that uses **Node.JS** for server-side interactions and static information serving, Google's **Firebase** for authentication and data storage, **Bootstrap** for responsive client-side styling, **jQuery** for client-side DOM interaction and **socket.io** for live messaging.

## Overview
### Features
- Accounts can be created or signed in to (these are securely managed by Firebase).
- Once in, a user may send other accounts 'contact' requests (using their email address).
- Once contact requests are accepted, a conversation is created for each contact.
- Contacts may send messages to each other in these conversations.
- Messages are saved meaning messages may be sent to a contact when they are not online.
- The web application has been designed to be responsive (using bootstrap). This means it has a separate layout for small screens (such as mobile).
- When a message is being sent to an online contact, the contact is alerted in their contacts list that the user is typing a message.
- Unread messages appear in bold in the contacts list.

### Dev Features
- A custom-made firebase mock is included for offline and in-memory database and authentication testing.

### Compatibility
The application has been tested and works on Google Chrome, Mozilla Firefox and Microsoft Edge. It is not compatible with Internet Explorer.

### Future Features
- More sign up options.
- Email address verification.
- Better profile with more information.
- Password reset.
- Send an email to users who do not have an account when adding contacts.
- More optimised data downloaded storage (for less Firebase bandwidth usage).
- More optimised database structure.
- Show whether contacts are online or not.
- Timestamps on messages.
- Ability to delete messages.

## Install and Setup
The repository is an NPM environment, meaning required packages can be installed simply using:
```
npm install
```

To run the application, (while not required) it is *strongly* recommended that a real Firebase instance is used, this is demonstrated in the following sub-section. The Firebase mock can be used for offline testing (when online Firebase is configured, client side configuration and service account information is ignored in this case).

### Setup using Firebase
To use Firebase with the project, an internet connection, Google account and (free) Firebase project is required. Setting up a Firebase project can be done in minutes as shown below. Alternatively, for the most up-to-date information, Google provide a setup guide [here](https://firebase.google.com/docs/web/setup "Firebase Setup") for client side (web) setup and [here](https://firebase.google.com/docs/admin/setup "Firebase Admin Setup") for (admin) server-side (Node.JS) setup. All that is required from these is the information on how to obtain and setup the client and server config keys, how to enable Email and Password authentication and setup a Realtime database (once done set rules to either enable full client access or use the rules defined below).

To setup a Firebase project, first create the project [here](https://console.firebase.google.com "Firebase Console").

Once created, a project overview page is displayed. To obtain the public web config data, click on the '</>' button icon, this will bring up some JavaScript embedded within a HTML template with a config variable resembling the following.
```javascript
var config = {
    apiKey: "<project key>",
    authDomain: "<project auth domain>.firebaseapp.com",
    databaseURL: "https://<project id>.firebaseio.com",
    projectId: "<project id>",
    storageBucket: "<project id>.appspot.com",
    messagingSenderId: "<id>"
};
```
Copy and paste this into *public/js/index.js* just before `firebase.initializeApp(config);` (or place it in the file such that the object the *config* variable represents ends up being passed into the *initializeApp* firebase function). It is worth noting that it is safe for this information to be publicly available provided that Realtime database rules have been properly implemented, sample rules will be provided later if desired.

The application uses Firebase Authentication to manage user accounts, for the sake of simplicity only Email and Password authentication has been configured to work with Firebase. To enable this in the Firebase Console, open the 'Authentication' tab on the left, then below the title open the 'Sign-in method' tab. Here a list of supported sign in methods are shown, click on the first one ('Email/Password') and enable it (don't enable 'passwordless sign-in').

The Node.JS server uses the firebase-admin package, this requires a project "service account" to be created. This is done by going into the project settings (clicking the gear icon to the right of 'Project Interview' on the left of the console and opening 'Project Settings'). Next open the 'Service accounts' tab and click "Generate new private key", this will download a JSON file with a private service account key, save this in the project's root directory as 'adminkey.json' for the server to automatically use it. If a different location or name is required, *firebase.js* can be edited on line 14 to reflect the new location to import the file from.

Recently, Firebase have started switching over to their 'Cloud Firestore' databases which uses a collection of documents model, this application however uses their original 'Realtime' database for its storage.

To setup the Realtime database with the project, open the 'Database' tab on the left of the Firebase console and scroll down to the 'Realtime Database' section, here click 'Create database' and select 'Start in test mode'. As previously mentioned, database rules can be used to control the data clients can access and modify, clicking 'Start in test mode' setup the rules such that any client with the config data can modify and access all database data (hence why a warning is displayed on the database page). These rules can be edited by opening the 'Rules' tab. A well properly designed client side with well-defined database rules can do most of the application's work with little to no contact with the Node server. For this application, the following rules are recommended.
```json
{
    "rules": {
        "user": {
            "$uid": {
                ".read": "auth != null && auth.uid == $uid",
                ".write": "auth != null && auth.uid == $uid",
                "displayName": {
                    ".read": "auth != null"
                },
                "email": {
                    ".read": "auth != null"
                }
            }
        }
    }
}
```
These rules state that authenticated clients can access (to read from and write to) the whole of the 'user/\<uid>' node in the database only if '\<uid>' is the Authenticator's assigned account unique identifier for the user. This means that clients can only access and modify their own data node. These rules also state that all authenticated clients may read the *displayName* and *email* of any other user provided that they know their UID.

Finally, in *firebase.js* make sure the variable *onlineFirebase* is set to *true* and run the application using:
```
npm start
```

### Setup using the Firebase Mock
The Firebase Mock provided with the application mirrors the functionality used in the application provided by the Firebase Authentication and Realtime Database services using an *in-memory* data model.

**Disclaimer:** The Firebase Mock provided does **no** authentication or database access validation and uses many shortcuts to provide the *same* functionality as provided by the real service. Thus, **it should not be used in any production build of the application**.

To setup the firebase mock, simply go into *firebase.js* and set the *onlineFirebase* variable to *false*.

The initial sample data used for the mock can be found in *firebase/mock/sample-authData.json* and *firebase/mock/sample-database.json*.

- **sample-authData.json** contains an initial custom mock representation of Firebase user accounts, these consist of emails and IDs (each being unique), a node is stored linking these both ways for ease of programming the mock. While the Firebase Authentication module has the capability of storing more information about the user (like display names) the application does not use these (these are instead stored in the Realtime database, as such the auth mock does not implement them).
- **sample-database.json** contains an initial mock JSON representation of the Firebase Realtime database, this is the same way that data is represented in real (online) Firebase projects (however data may be actually stored differently on their servers for efficiency).

These files can be edited to provide the server with different initial conditions. As provided in the auth data, there are three accounts with emails 'test@test.test', 'test2@test.test' and 'test3@test.test'. To sign in to these accounts enter the email on the sign in page along with any password with more than six characters (passwords are not stored or authenticated with the mock). As provided in the database: test@test.test has the display name 'Test Account 1', test2@test.test has the display name 'Test Account 2', test3@test.test has not yet entered a display name, test@test.test and test2@test.test are already contacts, test2@test.test and test3@test.test are already contacts and test3@test.test has sent a contact request to test@test.test.

All functionality used by the application with the online firebase should be possible with the mock firebase the main differences being:
- when the Node server is re-started the data is re-set to that in the sample files;
- logins are only valid for a single browser tab session and expire when the page is refreshed or left (this means that multiple accounts may be logged into on the same browser/device) 

Finally, run the application using:
```
npm start
```

## App Usage
When started, unless configured otherwise, the server is hosted on port 8080, this means the application can be accessed at ***localhost:8080*** or ***127.0.0.1:8080*** or (for access on other devices on the local network) ***(ip):8080*** where (ip) is the local IP of the device hosting the Node server.

Once connected, a sign in form is displayed. To access the sign up form, press the "Sign up" button. Signing up will automatically sign the new account in.

When signing in for the first time, the contacts list will be empty; on larger devices this is situated on the left sidebar, on smaller devices and phones this is located by pressing the 'Contacts' button in the collapsed navbar menu at the top. The navbar (when not stacked), from right to left, contains a sign out button, a button to view the license, a button to view and edit the user profile and a button to add contacts.

It is first recommended that a display name be set for the account for better identification when chatting, this can be done by pressing the 'My Profile' button on the navbar. Simply fill in the 'Display Name' field and press 'Save Changes'.

To add contacts, press the 'Add Contacts' button on the navbar and enter the email address of a desired contact. Incoming contact requests also appear in the 'Add Contacts' popup where they can be accepted or declined.

Once contacts have been added they appear in the contacts list. The last message sent to a chat is displayed under each contact name, of these unread messages appear in bold. If the contact has not set a display name their email address is shown. Selecting a contact will populate the chat window with past messages. If a user is connected to the chat when a message is being sent typed out, the sender is shown as typing in the contacts list.

## Database Structure
A Firebase Realtime database is a type of 'No-SQL' database, this means it is not strictly structured in a relational manner. Instead it is structured as a large JSON-like object with keys (known as 'nodes') and values where a value can be a primitive datatype value or an object, this produces a tree structure. An optimal No-SQL database layout is 'flat', meaning as a tree it has a height as small as possible. Unlike JSON however, objects (nodes) cannot be empty and arrays and lists are not supported, this is handled by storing an object with either the keys being the index of each value or by selecting alphabetically ordered (string) keys based on time, these are automatically handled by Firebase (only the second option has been implemented in the database mock).

This application uses the following database layout:
- user
    - (uid)
        - lastSeen: integer
        - email: string
        - contactRequests
            - (uid)
                - email: string
                - timestamp: integer
        - contacts
            - (uid)
                - conversationId: string
                - timestamp: integer
                - recentMessage: string
                - recentMessageTimestamp: integer
                - recentMessageViewed: boolean
- conversation
    - (conversationId)
        - created: integer
        - messages
            - (messageId)
                - text: string
                - senderId: (uid) string
                - timestamp: number

As can be seen, this is not the most optimal data structure however it is relatively simple.

## License
The license is available in the *LICENSE* file in the root of the repository.

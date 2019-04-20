# ProgNodeChat

**ProgNodeChat** is a simple chat client that uses **Node.JS** for server-side interactions and static information serving, Google's **Firebase** for authentication and data storage, **Bootstrap** for responsive client-side styling, **jQuery** for client-side DOM interaction and **socket.io** for live messaging.

## Features
- Accounts can be created or signed in to (these are securely managed by Firebase).
- Once in, a user may send other accounts 'contact' requests (using their email address).
- Once contact requests are accepted, a conversation is created for each contact.
- Contacts may send messages to each other in these conversations.
- Messages are saved meaning messages may be sent to a contact when they are not online.
- The web application has been designed to be responsive (using bootstrap). This means it has a separate layout for small screens (such as mobile).
- When a message is being sent to an online contact, the contact is alerted in their contacts list that the user is typing a message.
- Unread messages appear in bold in the contacts list.

## Dev Features
A custom-made firebase mock is included for offline and in-memory database and authentication testing.

## Install and Setup
The repository is an NPM environment, meaning required packages can be installed simply using:
```
npm install
```

To run the application, (while not required) it is *strongly* recommended that a real Firebase instance is used, this is demonstrated in the following sub-section. The Firebase mock can be used for offline testing (even when online Firebase is configured).

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

The application uses Firebase Authentication to manage user accounts, for the sake of simplicity only Email and Password authentication has been configured to work with Firebase. To enable this in the Firebase Console, open the 'Authentication' tab on the left, then below the title open the 'Sign-in method' tab. Here a list of supported signin methods are shown, click on the first one ('Email/Password') and enable it (don't enable 'passwordless sign-in').

The Node.JS server uses the firebase-admin package, this requires a project "service account" to be created. This is done by going into the project settings (clicking the gear icon to the right of 'Project Interview' on the left of the console and opening 'Project Settings'). Next open the 'Service accounts' tab and click "Generate new private key", this will download a JSON file with a private service account key, save this in the project's root directory as 'adminkey.json' for the server to automatically use it. If a different location or name is required, *firebase.js* can be edited on line 14 to reflect the new location to import the file from.

Recently, Firebase have rolled out their 'Cloud Firestore' databases, this application however uses their original 'Realtime' database for its storage.

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
These rules state that authenticated clients can access (to read from and write to) the whole of the 'user/<uid>' node in the database only if '<uid>' is the Authenticator's assigned account unique identifier for the user. This means that clients can only access and modify their own data node. These rules also state that all authenticated clients may read the *displayName* and *email* of any other user provided that they know their UID.

Finally, in *firebase.js* make sure the variable *onlineFirebase* is set to *true* and run the application using:
```
npm start
```

### Setup using the Firebase Mock
The Firebase Mock provided with the application mirrors the functionality used in the application provided by the Firebase Authentication and Realtime Database services using an *in-memory* data model.

**Disclaimer:** The Firebase Mock provided does **no** authentication or database access validation and uses many shortcuts to provide the *same* functionality as provided by the real service. Thus, **it should not be used in any production build of the application**.

To setup the firebase mock, simply go into *firebase.js* and set the *onlineFirebase* variable to *false*.

Finally, run the application using:
```
npm start
```

## License
The license is available in the *LICENSE* file in the root of the repository.

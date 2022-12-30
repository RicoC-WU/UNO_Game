# UNO_Game
An online game of UNO (not finished - work in progress)

WEB SERVER SETUP:

The website for this game can be vidited at the link rockjc01.hopto.org. The Web-server uses NGINX and is deployed from a Raspberry Pi that runs on LinuxOS. The Domain name wascreated using the free tier of NO-IP, mapping a hostname to the dynamic external IP address of the Raspberry Pi. 

WEBSITE FUNCTIONALITY SETUP: 

The website uses the following libraries:

React - Used to set up components for organizing code

socket.io - Used for performing specific tasks and sowing specific parts of the website to specfici users. For example, displaying a game of UNO to 4 specific clients in the same room. 

MySQL/MariaDB - used to tracking specific user information such as username, password, and win-loss record. While the database used is MariaDB specifically, the MySQL libraray is used for querying instead of the MariaDB library.

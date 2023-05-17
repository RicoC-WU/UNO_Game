# UNO_Game
An online game of UNO

LINK TO WEBSITE: rockjc01.ddns.net

WEB SERVER SETUP:

The website for this game can be vidited at the link rockjc01.hopto.org. The Web-server uses NGINX and is deployed from a Raspberry Pi that runs on LinuxOS. The Domain name wascreated using the free tier of NO-IP, mapping a hostname to the dynamic external IP address of the Raspberry Pi. 

WEBSITE FUNCTIONALITY SETUP: 

The website uses the following libraries/tools:

React - Used to set up components for organizing code

NodeJS - Used for creating server side code

ExpressJS - Used for creating NodeJS backend

socket.io - Used for performing specific tasks and sowing specific parts of the website to specfici users. For example, displaying a game of UNO to 4 specific clients in the same game. 

MySQL/MariaDB - used to tracking specific user information such as username, password, and win-loss record. While the database used is MariaDB specifically, the MySQL libraray is used for querying instead of the MariaDB library.

bCrpyt - Used for password encryption for security practices


Sources:
UNO Logo (\client\public\UNO_Logo.png): https://commons.wikimedia.org/wiki/File:UNO_Logo.svg

UNO Cards: (\client\public\Cards): https://www.textures-resource.com/pc_computer/uno/texture/8671/?source=genre

Home page background: https://store.playstation.com/en-us/product/UP0001-CUSA04071_00-UBSFTUNOULTIMATE

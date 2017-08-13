# MongoBongo
This application will backup specified mongo collections data (currently not the indexes) from one server to another.

You should schedule this daily either via a cron job (Linux) or a task scheduler (Windows).
The application will create a backup history on the targer mongo server for each collection you specified.

Example output on the destination server, if you was to have a collection "mycollection" backed up from the source mongo server.

```
Source DB collection
mycollection

Target DB collections (initial execute generates all collections, daily execution updates applicable collections)

mycollection_0days
mycollection_1days 
mycollection_2days 
mycollection_3days 
mycollection_4days 
mycollection_5days 
mycollection_6days 
mycollection_7days 
mycollection_14days 
mycollection_21days 
mycollection_28days 
```

# Start application

```
node backup.js
```

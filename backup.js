/*
    Author: Mete Kamil
    This service will backup collections from one server to another.
*/

var moment = require('moment');
var yesno = require('yesno');
var async = require('async');
var assert = require('assert');
var MongoClient = require('mongodb').MongoClient;
var config = require('./config.json');

//Source Database and Collections to backup.
var sourceDatabase = "yourdbname";
var collections = [
                   "collectionnamehere"
];

var cMessage="";
setInterval(function(){console.log(cMessage)},5000);

var sdb;
var tdb;

console.log('');
console.log('');
console.log('');
console.log(' _______  _____  __   _  ______  _____');
console.log(' |  |  | |     | | \\  | |  ____ |     |');
console.log(' |  |  | |_____| |  \\_| |_____| |_____|');
console.log(' ');
console.log(' ______   _____  __   _  ______  _____');
console.log(' |_____] |     | | \\  | |  ____ |     |');
console.log(' |_____] |_____| |  \\_| |_____| |_____|');
console.log(' ');
console.log(' ');
console.log('                v0.1');
console.log('');
console.log('');
console.log('SOURCE Server   : ' + config.sourceDB);
console.log('SOURCE Database : ' + sourceDatabase);
console.log('TARGET Server   : ' + config.targetDB);
console.log('TARGET Database : ' + sourceDatabase + "Backup");
console.log();

/*yesno.ask('Are you sure you want to continue?', true, function(ok) {
    if(ok) {*/

        console.log();
        console.log("Initializing Clone.");
        MongoClient.connect(config.targetDB, function(err, tmongoclient) {

            tdb = tmongoclient.db(sourceDatabase + "Backup");

            tdb.collection("_backupSchedule").find().toArray(function (err, schedules) {

                var currentSchedule = [];
                if (schedules.length==0) {

                    schedules = [];
                    schedules[0] = [];
                    schedules[0]["currentSchedule"]=[];
                    schedules[0]["currentSchedule"].push(new Date()); // 0day
                    schedules[0]["currentSchedule"].push(new Date()); // 1day
                    schedules[0]["currentSchedule"].push(new Date()); // 2day
                    schedules[0]["currentSchedule"].push(new Date()); // 3day
                    schedules[0]["currentSchedule"].push(new Date()); // 4day
                    schedules[0]["currentSchedule"].push(new Date()); // 5day
                    schedules[0]["currentSchedule"].push(new Date()); // 6day
                    schedules[0]["currentSchedule"].push(new Date()); // 7day
                    schedules[0]["currentSchedule"].push(new Date()); // 14day
                    schedules[0]["currentSchedule"].push(new Date()); // 21day
                    schedules[0]["currentSchedule"].push(new Date()); // 28day
                    schedules[0]["_id"] = 0;

                }


                var targetCollections=[];
                var dayInterval = 0;
                var daysMessage = "Intervals Executing: ";
                schedules[0]["currentSchedule"].forEach(function (day) {

                    if (new Date() >= day) {
                        targetCollections.push(dayInterval);
                        daysMessage += " " + dayInterval + "-days"

                    }
                    if (dayInterval<7) {
                        dayInterval = dayInterval + 1;
                    }
                    else {
                        dayInterval = dayInterval + 7;
                    }

                });

                //Exit out if we don't need to run.
                if (targetCollections.length == 0) {

                    tdb.close();
                    console.log();
                    console.log('No jobs are pending.');
                    process.exit();

                }

                console.log("Cloning Collection Data.");
                MongoClient.connect(config.sourceDB, function (err, smongoclient) {

                    sdb = smongoclient.db(sourceDatabase);
                    assert.equal(err, null);

                    async.eachSeries(collections, function iteratee(col, callback) {

                        totalProcessed = 0;
                        console.log("");
                        console.log('Cloning \'' + col + '\' collection');
                        process.stdout.write("Records cloned    " + totalProcessed + " documents\r");

                        sdb.collection(col).find({}, function (err, resultCursor) {

                            function processItem(err, docToClone) {
                                if (docToClone === null) {

                                    process.stdout.write(daysMessage + " - Clone Completed\r");
                                    console.log("");
                                    callback(null);
                                    return; // All done!

                                }

                                totalProcessed++;
                                cMessage = daysMessage + " - Records cloned  " + totalProcessed + " documents\r";

                                async.eachSeries(targetCollections, function iteratee(cInterval, callback) {
                                    tdb.collection(col + "_" + cInterval + "days").update({"_id": docToClone._id}, docToClone, {upsert: true}, function (err) {

                                        callback();

                                    });
                                },function(err,results) {

                                    resultCursor.nextObject(processItem);

                                });

                            }

                            resultCursor.nextObject(processItem);

                        });

                    }, function (err, results) {

                        var index=-1;
                        var dayInterval = 0;
                        schedules[0]["currentSchedule"].forEach(function (day) {

                            index++;
                            if (new Date() > day) {
                                schedules[0]["currentSchedule"][index] = new Date(moment(new Date()).add(dayInterval, 'day'));
                            }

                            if (dayInterval<7) {
                                dayInterval = dayInterval + 1;
                            }
                            else {
                                dayInterval = dayInterval + 7;
                            }

                        });

                        tdb.collection('_backupSchedule').update({"_id": schedules[0]["_id"]}, { "$set" : { "currentSchedule" : schedules[0]["currentSchedule"]}}, {upsert: true}, function (err) {

                            tdb.close();
                            sdb.close();
                            console.log();
                            console.log('Backup process completed.');
                            process.exit();

                        });
                    });
                });
            });
        });

/*    } else {

        console.log("User cancelled");
        process.exit();

    }
});*/
//dotenv for hidden data strings
require('dotenv').config();

//setup express
const path = require('path');
const express = require('express');
const fs = require('fs');

//setup express
const app = new express();
app.use(express.static(__dirname + '/public'));
app.use(express.static(__dirname + "/node_modules/bootstrap/dist/"));
app.use(express.static(__dirname + "/node_modules/bootstrap-icons/font"));

app.get('/', (req, res, next) => {
    res.sendFile(path.resolve(__dirname, 'public/index.html'));
});

//start webapp
const port = process.env.PORT || 8080;
app.listen(port, () => {
    console.log(`Listening on port ${port}!`)
});

//CronJobs
var CronJob = require('cron').CronJob;

var fiveMinJob = new CronJob(
  '*/5 * * * *',
  fiveMinJobFunc,
  null,
  true,
  "America/New_York"
);

async function fiveMinJobFunc() {
  console.log("Making API calls.");
  //get data
  var clanData = await update_clan_data();
  var warData = await update_war_data();

  //write to file - COMMENTED OUT TO SAVE MEMORY
  // fs.writeFileSync('public/data/clan_data.json', JSON.stringify(clanData));
  // fs.writeFileSync('public/data/war_data.json', JSON.stringify(warData));

  //parse server-side to reduce load on client.
  //clanData is a better format, start from there (non-shallow copy)
  var parsedData = JSON.parse(JSON.stringify(clanData));
  delete parsedData["memberList"];

  //remap member list from clan data to tag:data pair
  var clanMembers = {};
  for (var member of clanData["memberList"]) {
    clanMembers[member["tag"]]= member;
  }
  //wardata contains a bunch of players that are not current members. only add current member info.
  for (var participant of warData["clan"]["participants"]) {
    try {
      clanMembers[participant["tag"]]["warData"] = participant;
    } catch(e) {continue};
  }

  //add reordered member information to parsedData
  parsedData["memberList"] = clanMembers;
  //write to file
  fs.writeFileSync('public/data/parsed_data.json', JSON.stringify(parsedData));
}

var weekJob = new CronJob(
  '0 6 * * MON',
  week_update,
  null,
  true,
  'America/New_York'
);

async function week_update() {
  console.log("test");
}

//API query funciton

async function queryAPI(requestURL) {
  const response = await fetch(requestURL, {
    headers: {
      'Authorization': `Bearer ${process.env.API_KEY}`
    }
  });
  switch (response.status) {
      case 200:
          break;
      case 400:
        throw new Error("API Request Error: Client provided incorrect parameters for the request.");
        break;
      case 403:
        throw new Error("API Request Error: Access denied, either because of missing/incorrect credentials or used API token does not grant access to the requested resource.");
        break;
      case 404:
        throw new Error("API Request Error: Resource was not found.");
        break;
      case 429:
        throw new Error("API Request Error: Request was throttled, because amount of requests was above the threshold defined for the used API token.");
        break;
      case 500:
        throw new Error("API Request Error: Unknown error happened when handling the request.");
        break;
      case 503:
        throw new Error("API Request Error: Service is temprorarily unavailable because of maintenance.");
        break;
  }
  var data = await response.json();
  return data;
}


async function update_clan_data() {
  var data = null;
  try {
    data = await queryAPI(`https://api.clashroyale.com/v1/clans/%23${process.env.CLAN_TAG}`);
  } catch (e) {
    console.log(e);
    return;
  };
  return data;
}

async function update_war_data() {
  var data = null;
  try {
    data = await queryAPI(`https://api.clashroyale.com/v1/clans/%23${process.env.CLAN_TAG}/currentriverrace`);
  } catch (e) {
    console.log(e);
    return;
  };
  return data;
}
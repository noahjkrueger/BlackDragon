require('three');
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
app.listen(port, '0.0.0.0', () => {
    process.stdout.write(`Listening on port ${port}!\n`)
});

//CronJobs
var CronJob = require('cron').CronJob;

const meWeight = 0.55;
const deWeight = 0.2;
const doWeight = 0.25;

var fiveMinJob = new CronJob(
  '*/5 * * * *',
  parseDataFromAPI,
  null,
  true,
  "America/New_York"
);

async function parseDataFromAPI() {
  process.stdout.write("Updating data!\n");
  var clanData = null;
  var warData = null;
  //get data
  try {
    clanData = await update_clan_data();
    warData = await update_war_data();
  } catch (e) {
    process.stdout.write(e + "\n");
    return;
  }

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

  //find current medal requirement _> format in desc: (space)(number of n digits)(+)
  var plusIndex = parsedData["description"].indexOf("+");
  var spaceIndex = parsedData["description"].substring(0, plusIndex).lastIndexOf(" ");
  const mq = parsedData["description"].substring(spaceIndex + 1, plusIndex);
  parsedData["medalQuota"] = parseInt(mq);

  //for figuring out which weekly war day it is (1, 2, 3, 4)
  const wwDay = Math.max(0, (warData["periodIndex"] % 7) - 2)
  parsedData["weekWarDay"] = wwDay;

  //easier access to member count
  const numMembers = parsedData["members"];

  //get top medal and donor list
  var ctopDonations = 1; //no donos =/= top donor :(
  var ctopMedals = 1; //no medals =/= top medalist
  var topDonations = [];
  var topMedals = [];

  //sums of all
  var meSum= 0;
  var doSum = 0;
  var deSum = 0;
  
  for (const [key, value] of Object.entries(clanMembers)) {
    //check if top medalist
    var numMedals = 0;
    try { 
      numMedals = value["warData"]["fame"];
    } catch (e) {
      console.log(key + " must have just joined. no war data.");
      value["warData"] = {
        "fame": 0,
        "decksUsed": 0
      };
    }
      if (numMedals > ctopMedals) {
      topMedals = [key];
      ctopMedals = numMedals;
    } else if (numMedals === ctopMedals) {
      topMedals.push(key);
    }
    //check if top donor
    var numDonos = value["donations"];
    if (numDonos > ctopDonations) {
      topDonations = [key];
      ctopDonations = numDonos;
    } else if (numDonos === ctopDonations) {
      topDonations.push(key);
    }

    var decksUsed = value["warData"]["decksUsed"];

    //add stats to sums
    meSum += numMedals;
    doSum += numDonos;
    deSum += decksUsed;

    //participation
    clanMembers[key]["participation"] = {
      "medals": numMedals,
      "donos": numDonos,
      "decks": decksUsed,
      "wMedals": meWeight * numMedals,
      "wDonos": doWeight * numDonos,
      "wDecks": wwDay === 0  ? 0 : deWeight * decksUsed / (4 * wwDay),
    };
  }

    //store fun information
    parsedData["partFactors"] = {
      "doWeight": doWeight,
      "meWeight": meWeight,
      "deWeight": deWeight,
      "doTop": ctopDonations,
      "topDonors": topDonations,
      "meTop": ctopMedals,
      "topMedals": topMedals,
      "meAvg": meSum / numMembers,
      "doAvg": doSum / numMembers,
      "deAvg": wwDay === 0 ? 0 : deSum / numMembers
    }

  //Determine each member's badges
  for (const [key, value] of Object.entries(clanMembers)) {
    var badges = [];
    var status = "standing-good";
    //Determine if member is on track to hit quota or cannot hit quota
    if (value["warData"]["fame"] < (wwDay === 0 ? 0 : (parsedData["medalQuota"] / 4) * wwDay)) {
      status = "standing-warning";
    }
    else {
      const toQuota = parsedData["medalQuota"] - value["warData"]["fame"];
      const dut = value["warData"]["decksUsedToday"];
      var mePotential = 900 * (4 - wwDay);
      if (dut === 0) {
          mePotential += 900;
      }
      else if (dut === 1) {
          mePotential += 700;
      }
      else {
          mePotential += 200 * (4 - dut);
      }
      if (toQuota - mePotential > 0) {
          status = "standing-violation";
      }
    }
    //add role badge
    switch(value["role"]) {
      case "leader":
          badges.push("leader");
          break;
      case "coLeader":
          badges.push("coleader");
          break;
      case "elder":
          badges.push("elder");
          break
      case "member":
          badges.push("member");
          break;
    }
    //Trophy recognition
    if (value["trophies"] === 9000) {
      badges.push("ninek");
    }
    //CR vet by xp level
    if(value["expLevel"] >= 55) {
      badges.push("cr-vet");
    }
    //Weekly War Rec
    if (value["warData"]["fame"] >= 3000) {
      badges.push("medals-threek");
    } else if (value["warData"]["fame"] >= 2500) {
      badges.push("medals-twohalfk");
    } else if (value["warData"]["fame"] >= 2000) {
      badges.push("medals-twok");
    }
    //donations
    if(value["donations"] > 1000) {
      badges.push("donations-onek");
    }
    if(value["donations"] > 750) {
      badges.push("donations-sevenhalf");
    }
    if(value["donations"] > 500) {
      badges.push("donations-five");
    }
    //all daily war decks used badge
    if(value["warData"]["decksUsedToday"] == 4) {
      badges.push("decks-used-all");
    }
    //top medalist
    if (parsedData["partFactors"]["topMedals"].includes(key)) {
      badges.push("top-medalist");
    }
    //top donor
    if (parsedData["partFactors"]["topDonors"].includes(key)) {
      badges.push("top-donor");
    }
    clanMembers[key]["badges"] = badges;
    clanMembers[key]["status"] = status;
  }

  //overwrite memberList with new list that contains all that information
  parsedData["memberList"] = clanMembers;

  //create different orderings for displayin data client-side
  //add to parsed data. trophyOrder is the default order returned by API.
  //part: factor in maximums
  parsedData["ordering"] = {
    "Participation": Object.keys(clanMembers).sort((m1, m2) => {
      var a = clanMembers[m1]["participation"];
      var b = clanMembers[m2]["participation"];
      var av = (a["wMedals"] / ctopMedals) + (a["wDonos"] / ctopDonations) + (a["wDecks"]);
      var bv = (b["wMedals"] / ctopMedals) + (b["wDonos"] / ctopDonations) + (b["wDecks"]);
      return av < bv ? 1 : (av === bv ? 0 : -1);
    }),
    "Trophies": Object.keys(clanMembers),
    "Name": Object.keys(clanMembers).sort((m1, m2) => {
      var a = clanMembers[m1]["name"];
      var b = clanMembers[m2]["name"];
      return a != b ? (a < b ? -1 : 1) : 0;
    }),
    "Tag": Object.keys(clanMembers).sort((m1, m2) => {
      var a = clanMembers[m1]["tag"];
      var b = clanMembers[m2]["tag"];
      return a != b ? (a < b ? -1 : 1) : 0;
    })
  };

  //write to file
  fs.writeFileSync('public/data/parsed_data.json', JSON.stringify(parsedData));
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
      case 403:
        throw new Error("API Request Error: Access denied, either because of missing/incorrect credentials or used API token does not grant access to the requested resource.");
      case 404:
        throw new Error("API Request Error: Resource was not found.");
      case 429:
        throw new Error("API Request Error: Request was throttled, because amount of requests was above the threshold defined for the used API token.");
      case 500:
        throw new Error("API Request Error: Unknown error happened when handling the request.");
      case 503:
        throw new Error("API Request Error: Service is temprorarily unavailable because of maintenance.");
  }
  var data = await response.json();
  return data;
}


async function update_clan_data() {
  var data = null;
  try {
    data = await queryAPI(`https://api.clashroyale.com/v1/clans/%23${process.env.CLAN_TAG}`);
  } catch (e) {
      throw new Error(e);
  };
  return data;
}

async function update_war_data() {
  var data = null;
  try {
    data = await queryAPI(`https://api.clashroyale.com/v1/clans/%23${process.env.CLAN_TAG}/currentriverrace`);
  } catch (e) {
    throw new Error(e);
  };
  return data;
}

//run job on app startup - workaround application host spin-down issue.
parseDataFromAPI();
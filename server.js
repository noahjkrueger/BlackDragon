require('three');
require('dotenv').config();

//setup express and start webapp
const path = require('path');
const express = require('express');
const fs = require('fs');
const app = new express();
app.use(express.static(__dirname + '/public'));
app.use(express.static(__dirname + "/node_modules/bootstrap/dist/"));
app.use(express.static(__dirname + "/node_modules/chart.js/"));
app.get('/', (req, res, next) => {
    res.sendFile(path.resolve(__dirname, 'public/index.html'));
});
const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0', () => {
    process.stdout.write(`Listening on port ${port}!\n`)
});

async function spinUp() {
  await fiveMinFunc();
  await weekFunc();
}
spinUp();

//Set up cronjobs
var CronJob = require('cron').CronJob;

async function fiveMinFunc() {
  const cdata = await parseCurrentData();
  await updateActivityTracking(cdata);
}

async function weekFunc() {
  const hdata = await parseHistoricalData();
}

var fiveMinJob = new CronJob('*/5 * * * *', fiveMinFunc, null, true, "America/New_York");
var weekJob = new CronJob('0 6 * * 1', weekFunc, null, true, "America/New_York");

//API query funciton
async function queryAPI(requestURL) {
  const response = await fetch(requestURL, {headers: {'Authorization': `Bearer ${process.env.API_KEY}`}});
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

//Update functions
async function update_clan_data() {
  var data = null;
  try {
    data = await queryAPI(`https://api.clashroyale.com/v1/clans/%23${process.env.CLAN_TAG}`);
  } catch (e) {throw new Error(e);};
  return data;
}

async function update_war_data() {
  var data = null;
  try {
    data = await queryAPI(`https://api.clashroyale.com/v1/clans/%23${process.env.CLAN_TAG}/currentriverrace`);
  } catch (e) {throw new Error(e);};
  return data;
}

async function update_war_history() {
  var data = null;
  try {
    data = await queryAPI(`https://api.clashroyale.com/v1/clans/%23${process.env.CLAN_TAG}/riverracelog?limit=10`);
  } catch (e) {throw new Error(e);};
  return data;
}

async function updateActivityTracking(parsedData) {
  process.stdout.write("Updating activity data...\n");
  //Date object
  const date = new Date();
  const dayOfWeek = date.getDay();
  //load data
  var activityData = JSON.parse(fs.readFileSync('public/data/activity.json'));

  //update last seen for current members
  var updatedLastSeen = {};
  for(const [k, v] of Object.entries(parsedData["memberList"])) {
    updatedLastSeen[k] = v["lastSeen"];
  }
  //update day of week activity
  for(const [k, v] of Object.entries(parsedData["memberList"])) {
    const seen = v["lastSeen"];
    if (k in activityData["lastSeen"]) {
      if (activityData["lastSeen"][k] != seen) {
        activityData[`day-${dayOfWeek}`].push(seen);
      }
    }
  }
  activityData["lastSeen"] = updatedLastSeen;
  fs.writeFileSync('public/data/activity.json', JSON.stringify(activityData));
  process.stdout.write("Activity Data updated!\n");
  return activityData;
}

async function parseHistoricalData() {
  process.stdout.write("Updating 10 week historical data...\n");
  var historyData = null;
    //get data
    try {
      historyData = await update_war_history();
    } catch (e) {
      process.stdout.write(e + "\n");
      return;
    }
    //only care about our clan lol
    var parsedHistoryByTag = {};
    for (const week of historyData["items"]) {
      for (const elm of week["standings"]) {
        const clan = elm["clan"];
        if (clan["tag"] === `#${process.env.CLAN_TAG}`) {
          for (const member of clan["participants"]) {
            const tag = member["tag"];
            if (!(tag in parsedHistoryByTag)) {
              parsedHistoryByTag[tag] = {
                "deckUseHistory": [member["decksUsed"]],
                "fameHistory": [member["fame"]],
                "historyBadges": []
              };
            }
            else {
              parsedHistoryByTag[tag]["deckUseHistory"].push(member["decksUsed"]);
              parsedHistoryByTag[tag]["fameHistory"].push(member["fame"]);
            }
          }
        }
      }
    }
    //create tags
    for (const [key, value] of Object.entries(parsedHistoryByTag)) {
      const deckSum = value["deckUseHistory"].reduce((partialSum, a) => partialSum + a, 0);
      const medalSum = value["fameHistory"].reduce((partialSum, a) => partialSum + a, 0);
      const historyLength = value["deckUseHistory"].length;

      const deckAvg = deckSum / historyLength;
      if (deckAvg === 16) {
        parsedHistoryByTag[key]["historyBadges"].push("history-decks-16");
      } else if (deckAvg > 12) {
        parsedHistoryByTag[key]["historyBadges"].push("history-decks-12");
      }

      const medalAvg = medalSum / historyLength;
      if (medalAvg > 3000) {
        parsedHistoryByTag[key]["historyBadges"].push("history-medals-2750");
      } else if (medalAvg > 2500) {
        parsedHistoryByTag[key]["historyBadges"].push("history-medals-2500");
      }
      else if (medalAvg > 2000) {
        parsedHistoryByTag[key]["historyBadges"].push("history-medals-2000");
      }
    }
    fs.writeFileSync('public/data/parsed_history.json', JSON.stringify(parsedHistoryByTag));
    process.stdout.write("Historical Data updated!\n");
    return parsedHistoryByTag;
}

async function parseCurrentData() {
  process.stdout.write("Updating current week data...\n");

  const meWeight = 0.55;
  const deWeight = 0.2;
  const doWeight = 0.25;

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
    //Determine if member is on track to hit quota or cannot hit quota
    if (value["warData"]["fame"] < (wwDay === 0 ? 0 : (parsedData["medalQuota"] / 4) * wwDay)) {
      badges.push("standing-warning");
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
          badges.push("standing-violation");
      }
      else {
        badges.push("standing-good")
      }
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
  }

  //overwrite memberList with new list that contains all that information
  parsedData["memberList"] = clanMembers;

  //create different orderings for displayin data client-side
  //add to parsed data. trophyOrder is the default order returned by API.
  //part: factor in maximums
  var porder = Object.keys(clanMembers).sort((m1, m2) => {
    var a = clanMembers[m1]["participation"];
    var b = clanMembers[m2]["participation"];
    var av = (a["wMedals"] / ctopMedals) + (a["wDonos"] / ctopDonations) + (a["wDecks"]);
    var bv = (b["wMedals"] / ctopMedals) + (b["wDonos"] / ctopDonations) + (b["wDecks"]);
    return av < bv ? 1 : (av === bv ? 0 : -1);
  });
  var torder = Object.keys(clanMembers);
  var norder = Object.keys(clanMembers).sort((m1, m2) => {
    var a = clanMembers[m1]["name"];
    var b = clanMembers[m2]["name"];
    return a != b ? (a < b ? -1 : 1) : 0;
  });
  var tgorder = Object.keys(clanMembers).sort((m1, m2) => {
    var a = clanMembers[m1]["tag"];
    var b = clanMembers[m2]["tag"];
    return a != b ? (a < b ? -1 : 1) : 0;
  });
  
  parsedData["ordering"] = {
    "Participation High to Low": porder,
    "Participation Low to High": porder.slice().reverse(),
    "Trophies High to Low": torder,
    "Trophies Low to High": torder.slice().reverse(),
    "Name A-Z": norder,
    "Name Z-A": norder.slice().reverse(),
    "Tag A-Z": tgorder,
    "Tag Z-A": tgorder.slice().reverse(),
  };

  //write to file
  fs.writeFileSync('public/data/parsed_data.json', JSON.stringify(parsedData));
  process.stdout.write("Current week data updated.\n");
  return parsedData;
}
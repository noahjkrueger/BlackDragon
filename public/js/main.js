var popoverList = [];

//Icon Generator
function getIcon(classes, color) {
    var icon_element = document.createElement("i");
    for (var classname of classes) {
        icon_element.classList.add(classname);
    }
    if (color) {
        icon_element.style = "color: " + color;
    }
    return icon_element;
}

//Generate a badge
function generateBadge(iconclasses, iconcolor, buttonvariant, tooltiptext) {
    var badge = document.createElement("button");
    var icon = getIcon(iconclasses, iconcolor);

    badge.classList.add("btn");
    badge.classList.add("btn-sm");
    badge.classList.add(buttonvariant);

    badge.setAttribute("data-bs-toggle", "tooltip");
    badge.setAttribute("data-bs-placement", "right");
    badge.setAttribute("data-bs-title", tooltiptext);

    badge.appendChild(icon);
    popoverList.push(new bootstrap.Tooltip(badge));
    return badge;
}

function createStackedMedalBar(medals, decks, donos, mMedals, mDonos, warWeekDay) {
    var stacked = document.createElement("div");
    stacked.classList.add("progress-stacked");
    stacked.appendChild(createMedalBar(decks, "text-bg-primary", 4 * warWeekDay, "Weekly War Decks: " + decks, 0.15));
    stacked.appendChild(createMedalBar(medals, "text-bg-danger", mMedals, "Weekly War Medals: " + medals, 0.6));
    stacked.appendChild(createMedalBar(donos, "text-bg-success", mDonos, "Weekly Donations: " + donos, 0.25));
    return stacked;
}

//medal bar
function createMedalBar(value, style, max, description, scalefactor) {
    var bar = document.createElement("div");
    bar.classList.add("progress-bar");
    bar.classList.add("progress-bar-striped");
    bar.classList.add("progress-bar-animated");
    bar.classList.add(style);
    bar.innerText = value;

    var barwrap = document.createElement("div");
    barwrap.appendChild(bar);
    barwrap.classList.add("progress");
    barwrap.setAttribute("role", "progressbar");
    barwrap.setAttribute("aria-valuenow", value);
    barwrap.setAttribute("aria-valuemin", "0");
    barwrap.setAttribute("aria-valuemax", max);
    barwrap.setAttribute("style", "width: " + Math.round((100 * value /  max) * scalefactor) + "%");

    barwrap.setAttribute("data-bs-toggle", "tooltip");
    barwrap.setAttribute("data-bs-placement", "top");
    barwrap.setAttribute("data-bs-title", description);
    popoverList.push(new bootstrap.Tooltip(barwrap));

    return barwrap;
}

async function initData() {
    var data = null;

    //Get most recent parsed
    //Possible Fetch Errors here (no handling)
    await fetch('./data/parsed_data.json').then((response) => {
        //Update Table Caption to reflect data modify date
        document.getElementById("member-list-caption").innerText = `Last Updated: ${response["headers"].get("last-modified")}`;
        return response.json();
    }).then((json) => data = json);

    //Update Clan information
    var clandesc = document.getElementById("clan-desc");
    clandesc.appendChild(getIcon(["fa-solid", "fa-scroll"], "#fff"));
    clandesc.innerHTML += data["description"];

    var clanscore = document.getElementById("clan-score");
    clanscore.appendChild(getIcon(["fa-solid", "fa-trophy"], "#ad00f1"));
    clanscore.innerHTML += data["clanWarTrophies"];

    var clantrophies = document.getElementById("clan-trophies");
    clantrophies.appendChild(getIcon(["fa-solid", "fa-trophy"], "#ffe75c"));
    clantrophies.innerHTML += data["clanScore"];

    var clandono = document.getElementById("clan-donos");
    clandono.appendChild(getIcon(["fa-solid", "fa-gift"], "#00a00d"));
    clandono.innerHTML += data["donationsPerWeek"];

    //Iterate through the member list, API returns member list in order of trophies max->min
    var counter = 1;

    //top donor
    var topDonors = [];
    var topDono = 1; //no donos, no rec

    //top medalist
    var topMedals = [];
    var topMedal = 1; //no medals, no recognition

    for (const [key, value] of Object.entries(data["memberList"])) {
        //create new row
        var entryRow = document.createElement("tr");

        //name col
        datapoint = document.createElement("td");
        datapoint.innerHTML = `${counter}. ${value["name"]}<a class="tag-link" href='https://royaleapi.com/player/${key.substring(1)}' target="_blank"> ${key}</a>`;
        datapoint.id = "name" + key;
        entryRow.appendChild(datapoint);

        //trophies col
        datapoint = document.createElement("td");
        icon = getIcon(["fa-solid", "fa-trophy"], "#ffe75c");
        datapoint.appendChild(icon);
        datapoint.innerHTML += " " + value["trophies"];
        datapoint.id = "trophies" + key;
        entryRow.appendChild(datapoint);

        //participation row
        datapoint = document.createElement("td");
        datapoint.id = "participation" + key;
        entryRow.appendChild(datapoint);


        //badges
        datapoint = document.createElement("td");
        //add role badge
        switch(value["role"]) {
            case "leader":
                datapoint.appendChild(generateBadge(["fa-solid", "fa-chess-king"], "", "btn-light", "Crowned Dragon (Leader)"));
                break;
            case "coLeader":
                datapoint.appendChild(generateBadge(["fa-solid", "fa-fire"], "", "btn-outline-warning", "Ancient Dragon (Co-Leader)"));
                break;
            case "elder":
                datapoint.appendChild(generateBadge(["fa-solid", "fa-fire-flame-curved"], "#f59042", "btn", "Elder Dragon (Elder)"));
                break
            case "member":
                datapoint.appendChild(generateBadge(["fa-solid", "fa-egg"], "#ffffff", "btn", "Baby Dragon (Member)"));
                break;
        }

        //Weekly medals recognition
        if (value["warData"]["fame"] >= 1500) {
            datapoint.appendChild(generateBadge(["fa-solid", "fa-dragon"], "#f59042", "btn", "1500+ Weekly Medals!"));
        }
        if (value["warData"]["fame"] >= 2000) {
            datapoint.appendChild(generateBadge(["fa-solid", "fa-dragon"], "", "btn-outline-danger", "2000+ Weekly Medals!"));
        } 
        if (value["warData"]["fame"] >= 2500) {
            datapoint.appendChild(generateBadge(["fa-solid", "fa-dragon"], "", "btn-danger", "2500+ Weekly Medals!"));
        }

        //check if top medalist
        if (value["warData"]["fame"] > topMedal) {
            topMedals = [key];
            topMedal = value["warData"]["fame"];
        } else if(value["warData"]["fame"] === topMedal) {
            topMedals.push(key);
        }

        //CR vet by xp level
        if(value["expLevel"] >= 55) {
            datapoint.appendChild(generateBadge(["fa-solid", "fa-clock"], "", "btn-outline-primary", "Level 55+"));
        }

        //donations
        if(value["donations"] > 250) {
            datapoint.appendChild(generateBadge(["fa-solid", "fa-gift"], "#00a00d", "btn", "250+ Weekly Donations!"));
        }
        if (value["donations"] > 500) {
            datapoint.appendChild(generateBadge(["fa-solid", "fa-gift"], "", "btn-outline-success", "500+ Weekly Donations!"));
        } 

        //check if top donor
        if (value["donations"] > topDono) {
            topDonors = [key];
            topDono = value["donations"];
            
        } else if(value["donations"] === topDono) {
            topDonors.push(key);
        }

        //all daily war decks used badge
        if(value["warData"]["decksUsedToday"] == 4) {
            datapoint.appendChild(generateBadge(["fa-solid", "fa-copy"], "", "btn-outline-info", "All decks used today! (Includes training days)"));
        }

        datapoint.id = "badges" + key;
        entryRow.appendChild(datapoint);

        //append row to member list element
        document.getElementById("member-list").appendChild(entryRow);
        counter+=1;
    }

    //top medals
    for (var id of topMedals) {
        var badgetd = document.getElementById("badges"+id);
        badgetd.appendChild(generateBadge(["fa-solid", "fa-hand-fist"], "", "btn-danger", "#1 War Medal Earner: " + topMedal + " medals!"));
        // badgetd.parentElement.classList.add("table-warning");
    }

    //top donos
    for (var id of topDonors) {
        var badgetd = document.getElementById("badges"+id);
        badgetd.appendChild(generateBadge(["fa-solid", "fa-hand-holding-medical"], "", "btn-success", "#1 Donor: " + topDono + " donations!"));
        // badgetd.parentElement.classList.add("table-success");
    }

    //create medal bars
    for (const [key, value] of Object.entries(data["memberList"])) {
        var stackedBars = createStackedMedalBar(value["warData"]["fame"], value["warData"]["decksUsed"], value["donations"], topMedal, topDono, data["weekWarDay"]);
        document.getElementById("participation" + key).appendChild(stackedBars);
    }
}

//Populate Data
initData();
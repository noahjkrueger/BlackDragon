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
    if (warWeekDay > 0) {
        stacked.appendChild(createMedalBar(decks, "text-bg-pimary", 4 * warWeekDay, "Weekly War Decks: " + decks, 0.15));
        stacked.appendChild(createMedalBar(medals, "text-bg-danger", mMedals, "Weekly War Medals: " + medals, 0.6));
        stacked.appendChild(createMedalBar(donos, "text-bg-success", mDonos, "Weekly Donations: " + donos, 0.25));
    }
    else {
        stacked.appendChild(createMedalBar(donos, "text-bg-success", mDonos, "Weekly Donations: " + donos, 1));
    }
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
    var scaleRatio = max === 0 ? 0 : Math.round((100 * value /  max) * scalefactor);
    barwrap.setAttribute("style", "width: " + scaleRatio + "%");

    barwrap.setAttribute("data-bs-toggle", "tooltip");
    barwrap.setAttribute("data-bs-placement", "top");
    barwrap.setAttribute("data-bs-title", description);
    popoverList.push(new bootstrap.Tooltip(barwrap));

    return barwrap;
}

async function initData() {
    var data = null;
    //Get most recent parsed
    try {
        await fetch('./data/parsed_data.json').then((response) => {
            //Update Table Caption to reflect data modify date
            document.getElementById("member-list-caption").innerText = `Last Updated: ${response["headers"].get("last-modified")}`;
            return response.json();
        }).then((json) => data = json);
    } catch (e) {
        window.alert(e);
        return;
    }

    //Clan tag
    var clantag = document.getElementById("clan-tag");
    clantag.appendChild(getIcon(["fa-solid", "fa-hashtag"], "#ff0000"));
    clantag.innerHTML += data["tag"].substring(1);

    //Update Clan information
    var clandesc = document.getElementById("clan-desc");
    clandesc.appendChild(getIcon(["fa-solid", "fa-comment"], "#fff"));
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

    var counter = 1;

    for (const key of data["ordering"]["participationOrder"]) {
        const value = data["memberList"][key];
        //create new row
        var entryRow = document.createElement("tr");

        //name col
        datapoint = document.createElement("td");
        datapoint.innerHTML = `${counter}. ${value["name"]}<a class="tag-link" href='https://royaleapi.com/player/${key.substring(1)}' target="_blank"> ${key}</a>`;
        datapoint.id = "name" + key;
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
        if (value["warData"]["fame"] >= 2000) {
            datapoint.appendChild(generateBadge(["fa-solid", "fa-dragon"], "#ff003e", "btn", "2000+ Weekly Medals!"));
        }
        if (value["warData"]["fame"] >= 2500) {
            datapoint.appendChild(generateBadge(["fa-solid", "fa-dragon"], "", "btn-outline-danger", "2500+ Weekly Medals!"));
        } 
        if (value["warData"]["fame"] >= 3000) {
            datapoint.appendChild(generateBadge(["fa-solid", "fa-dragon"], "", "btn-danger", "3000+ Weekly Medals!"));
        }

        //CR vet by xp level
        if(value["expLevel"] >= 55) {
            datapoint.appendChild(generateBadge(["fa-solid", "fa-clock"], "#00cff3", "btn", "Level 55+"));
        }

        //donations
        if(value["donations"] > 250) {
            datapoint.appendChild(generateBadge(["fa-solid", "fa-gift"], "#00a00d", "btn", "250+ Weekly Donations!"));
        }
        if (value["donations"] > 500) {
            datapoint.appendChild(generateBadge(["fa-solid", "fa-gift"], "", "btn-outline-success", "500+ Weekly Donations!"));
        } 

        //all daily war decks used badge
        if(value["warData"]["decksUsedToday"] == 4) {
            datapoint.appendChild(generateBadge(["fa-solid", "fa-copy"], "#0070ff", "btn", "All decks used today! (Includes training days)"));
        }

        datapoint.id = "badges" + key;
        entryRow.appendChild(datapoint);

        //trophies col
        datapoint = document.createElement("td");
        icon = getIcon(["fa-solid", "fa-trophy"], "#ffe75c");
        datapoint.appendChild(icon);
        datapoint.innerHTML += " " + value["trophies"];
        datapoint.id = "trophies" + key;
        entryRow.appendChild(datapoint);

        //append row to member list element
        document.getElementById("member-list").appendChild(entryRow);
        counter += 1;
    }

    //top medals
    for (var id of data["tops"]["medalists"]) {
        var badgetd = document.getElementById("badges"+id);
        badgetd.appendChild(generateBadge(["fa-solid", "fa-hand-fist"], "", "btn-danger", "#1 War Medal Earner: " + data["tops"]["cMedals"] + " medals!"));
    }

    //top donos
    for (var id of data["tops"]["donors"]) {
        var badgetd = document.getElementById("badges"+id);
        badgetd.appendChild(generateBadge(["fa-solid", "fa-hand-holding-medical"], "", "btn-success", "#1 Donor: " + data["tops"]["cDonations"] + " donations!"));
    }

    //create medal bars
    for (const [key, value] of Object.entries(data["memberList"])) {
        var stackedBars = createStackedMedalBar(value["warData"]["fame"], value["warData"]["decksUsed"], value["donations"], data["tops"]["cMedals"], data["tops"]["cDonations"], data["weekWarDay"]);
        document.getElementById("participation" + key).appendChild(stackedBars);
    }
}

//Populate Data
initData();

//links popup
bootstrap.Toast.getOrCreateInstance(document.getElementById('liveToast')).show();
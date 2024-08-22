class DocumentHelper {
    appendClassList(elm, classlist) {
        for (const classname of classlist) {
            elm.classList.add(classname);
        }
    }

    generateIcon(classes, color="") {
        var icon = document.createElement("i");
        this.appendClassList(icon, classes);
        if (color) {
            icon.style = `color : ${color}`;
        }
        return icon;
    } 

}

const helper = new DocumentHelper();
var popoverList = [];
var orderingSelector = "";

function updateMetadata(updateTime, clanTag, clanMembers, clanDescription, clanScore, clanTrophies, clanDonations) {
    function updateItem(id, classlist, color, appendText) {
        var elm = document.getElementById(id);
        //reset HTML
        elm.innerHTML = "";
        elm.appendChild(helper.generateIcon(classlist, color));
        elm.innerHTML += appendText;
    }
    //Update metadata-data-time
    updateItem("metadata-data-time", ["fa-solid", "fa-pen-to-square"], "#ff0000", `Last Updated: ${updateTime}`);

    //Update metadata-clan-tag
    updateItem("metadata-clan-tag", ["fa-solid", "fa-hashtag"], "#ff0000", clanTag);

    //Update metadata-clan-members
    updateItem("metadata-clan-members", ["fa-solid", "fa-person"], "#00cff3", `${clanMembers}/50`);

    //Update metadata-clan-description
    updateItem("metadata-clan-description", ["fa-solid", "fa-comment"], "", clanDescription);

    //Update metadata-clan-score
    updateItem("metadata-clan-score", ["fa-solid", "fa-trophy"], "#ffe75c", clanScore);
    
    //Update metadata-clan-trophies
    updateItem("metadata-clan-trophies", ["fa-solid", "fa-trophy"], "#ad00f1", clanTrophies);

    //Update metadata-clan-donations
    updateItem("metadata-clan-donations", ["fa-solid", "fa-gift"], "#00a00d", clanDonations);
}

async function initOrderButton(orderingKeys) {
    var select = document.getElementById("data-ordering");
    select.innerHTML = "";
    for (const key of orderingKeys) {
        var option = document.createElement("option");
        option.setAttribute("value", key);
        option.innerText = `Sort by: ${key}`;
        select.appendChild(option);
    }
    select.onchange = () => {
        if (select.value != orderingSelector) {
            orderingSelector = select.value;
            populateMemberList(data, historyData);
        }
    };
    orderingSelector = orderingKeys[0];
}


async function populateMemberList(data, history) {
    var memberCanvas = document.getElementById("member-canvas");
    memberCanvas.innerHTML = "";
    //Set spinner status to 'on' (visible)
    setLoaderVisibility(true);

    //helper functions for orginization
    function generateBadge(iconClasses, iconColor, buttonVariant, toolTipText, toolTipDirection="top") {
        var badge = document.createElement("button");
        var icon = helper.generateIcon(iconClasses, iconColor);
    
        badge.classList.add("btn");
        badge.classList.add("btn-sm");
        badge.classList.add(buttonVariant);
    
        badge.setAttribute("data-bs-toggle", "tooltip");
        badge.setAttribute("data-bs-placement", toolTipDirection);
        badge.setAttribute("data-bs-title", toolTipText);
    
        badge.appendChild(icon);
        popoverList.push(new bootstrap.Tooltip(badge));
        return badge;
    }

    function getBadge(badge){
        switch(badge) {
            case "leader":
                return generateBadge(["fa-solid", "fa-chess-king"], "", "btn-light", "Crowned Dragon (Leader)", "right");
            case "coleader":
                return generateBadge(["fa-solid", "fa-fire"], "", "btn-outline-warning", "Ancient Dragon (Co-Leader)", "right");
            case "elder":
                return generateBadge(["fa-solid", "fa-fire-flame-curved"], "#f59042", "btn", "Elder Dragon (Elder)", "right");
            case "member":
                return generateBadge(["fa-solid", "fa-egg"], "#ffffff", "btn", "Baby Dragon (Member)", "right");
            case "standing-good":
                return generateBadge(["fa-solid", "fa-circle-check"], "", "btn-outline-success", "Good Standing!", "right");
            case "standing-warning":
                return generateBadge(["fa-solid", "fa-circle-exclamation"], "#ffbf00", "btn", "Not on track to hit medal quota.", "right");
            case "tanding-violation":
                return generateBadge(["fa-solid", "fa-circle-exclamation"], "", "btn-danger", "Cannot meet medal quota.", "right");
            case "history-decks-12":
                return generateBadge(["fa-solid", "fa-fire-flame-simple"], "", "btn-outline-primary", "Averages over 12 Decks per week!");
            case "history-decks-16":
                return generateBadge(["fa-solid", "fa-fire-flame-simple"], "", "btn-primary", "Averages 16 Decks per week!");
            case "history-medals-2000":
                return generateBadge(["fa-solid", "fa-khanda"], "#ff0000", "btn", "Averages over 2000 Medals per Week!");
            case "history-medals-2500":
                return generateBadge(["fa-solid", "fa-khanda"], "", "btn-outline-danger", "Averages over 2500 Medals per week!");
            case "history-medals-2750":
                return generateBadge(["fa-solid", "fa-khanda"], "", "btn-danger", "Averages over 2750 Medals per week!");
            case "ninek":
                return generateBadge(["fa-solid", "fa-trophy"], "#ffe75c", "btn", "9000 Trophies!");
            case "cr-vet":
                return generateBadge(["fa-solid", "fa-clock"], "#00cff3", "btn", "Level 55+");
            case "medals-threek":
                return generateBadge(["fa-solid", "fa-dragon"], "", "btn-danger", "3000+ Weekly Medals!");
            case "medals-twohalfk":
                return generateBadge(["fa-solid", "fa-dragon"], "", "btn-outline-danger", "2500+ Weekly Medals!");
            case "medals-twok":
                return generateBadge(["fa-solid", "fa-dragon"], "#ff003e", "btn", "2000+ Weekly Medals!");
            case "donations-onek":
                return generateBadge(["fa-solid", "fa-gift"], "", "btn-success", "1000+ Weekly Donations!");
            case "donations-sevenhalf":
                return generateBadge(["fa-solid", "fa-gift"], "", "btn-outline-success", "750+ Weekly Donations!");
            case "donations-five":
                return generateBadge(["fa-solid", "fa-gift"], "#00a00d", "btn", "500+ Weekly Donations!");
            case "decks-used-all":
                return generateBadge(["fa-solid", "fa-copy"], "#0070ff", "btn", "All decks used today! (Includes training days)");
            case "top-medalist":
                return generateBadge(["fa-solid", "fa-hand-fist"], "", "btn-danger", "#1 War Week Medalist: " + data["partFactors"]["meTop"] + " medals!");
            case "top-donor":
                return generateBadge(["fa-solid", "fa-hand-holding-medical"], "", "btn-success", "#1 Weekly Donor: " + data["partFactors"]["doTop"] + " donations!");
            default:
                break;
        }
    }

    function setTopCardInfo(info, role, status, name, tag, trophies) {
        var statusDiv = document.createElement("div");
        helper.appendClassList(statusDiv, ["card-header-med"]);
        statusDiv.appendChild(getBadge(role));
        statusDiv.appendChild(getBadge(status));

        var nameDiv = document.createElement("div");
        helper.appendClassList(nameDiv, ["card-header-lg"]);
        nameDiv.innerHTML = name;

        var tagDiv = document.createElement("a");
        helper.appendClassList(tagDiv, ["member-tag-link"]);
        tagDiv.setAttribute("href", `https://royaleapi.com/player/${tag.substring(1)}`);
        tagDiv.setAttribute("target", "_blank");
        tagDiv.innerText = tag;
        nameDiv.appendChild(tagDiv);

        var trophiesDiv = document.createElement("div");
        helper.appendClassList(trophiesDiv, ["card-header-sm"]);
        trophiesDiv.appendChild(helper.generateIcon(["fa-solid", "fa-trophy"], "#ffe75c"));
        trophiesDiv.innerHTML += trophies;

        info.appendChild(statusDiv);
        info.appendChild(nameDiv);
        info.appendChild(trophiesDiv);
    }

    function setMidCard1Info(info, member, factors, wwd) {
        function createMedalBar(weight, max, value, theme, predesc) {
            var bar = document.createElement("div");
            bar.classList.add("progress-bar");
            bar.classList.add("progress-bar-striped");
            bar.classList.add("progress-bar-animated");
            bar.classList.add(theme);
            bar.innerText = value;
        
            var barwrap = document.createElement("div");
            barwrap.appendChild(bar);
            barwrap.classList.add("progress");
            barwrap.setAttribute("role", "progressbar");
            barwrap.setAttribute("aria-valuenow", value);
            barwrap.setAttribute("aria-valuemin", "0");
            barwrap.setAttribute("aria-valuemax", max);
        
            var scaleRatio = max === 0 ? 0 : Math.round((100 * value /  (max === 0 ? 1 : max)) * weight);
            barwrap.setAttribute("style", "width: " + scaleRatio + "%");
        
            barwrap.setAttribute("data-bs-toggle", "tooltip");
            barwrap.setAttribute("data-bs-placement", "top");
            barwrap.setAttribute("data-bs-title", `${predesc}${value}`);
            popoverList.push(new bootstrap.Tooltip(barwrap));
        
            return barwrap;
        }
        var stacked = document.createElement("div");
        stacked.classList.add("progress-stacked");
        stacked.appendChild(createMedalBar(factors["deWeight"], 4 * wwd, member["participation"]["decks"], "text-bg-pimary", "Weekly War Decks: "));
        stacked.appendChild(createMedalBar(factors["meWeight"], factors["meTop"], member["participation"]["medals"], "text-bg-danger", "Weekly War Medals: "));
        stacked.appendChild(createMedalBar(factors["doWeight"], factors["doTop"], member["participation"]["donos"], "text-bg-success", "Weekly Donations: "));
        info.appendChild(stacked);
    }

    function setMidCard2Info(info, history) {
        function createGraph(parent, dataPoints, title, dataLineColor, averageLineColor, min, max) {
            var canvas = document.createElement("canvas");
            const average = dataPoints.reduce((sum, i) => {return sum + i}) / dataPoints.length;
            const avgarr = Array(dataPoints.length).fill(0).map((_, i) => {return average;});
            const labels = Array(dataPoints.length).fill().map((_, index) => `-${dataPoints.length-index} Wars`);
            const data = {
                labels: labels,
                datasets: [
                    {
                        label: title,
                        data: dataPoints,
                        borderColor: dataLineColor,
                        tension: 0.1
                    },
                    {
                        label: `Average ${title}`,
                        data: avgarr,
                        borderColor: averageLineColor,
                        tension: 0.1
                    },
                ]
            }
            const options = {
                scales: {
                    y: {
                        suggestedMin: min,
                        suggestedMax: max
                    }
                },
                plugins: {
                    legend: {
                        display: false,
                    },
                    title: {
                        display: true,
                        text: title,
                        color: "#ffffff",
                        padding: {
                            top: 10,
                            bottom: 30
                        }
                    }
                }
            }
            new Chart(canvas, {
                type: 'line',
                data: data,
                options: options
            });
            parent.appendChild(canvas);
        }

        const deckUsage = history["deckUseHistory"].slice().reverse();
        const medalGains = history["fameHistory"].slice().reverse();

        var graphs = document.createElement("div");
        createGraph(graphs, deckUsage, "Deck Usage", "#0070ff", "#ffffff", 0, 16);
        createGraph(graphs, medalGains, "Medals Earned", "#ff0000", "#ffffff", 0, 3600);
        info.appendChild(graphs);
    }

    function setBotCardInfo(info, badges) {
        for (const badge of badges) {
            info.appendChild(getBadge(badge));
        }
    }

    //Get current ordering
    const order = data["ordering"][orderingSelector];
    const members = data["memberList"];

    var cardInRow = 0;
    var row = document.createElement("div");
    for (const k of order) {
        const v = members[k];
        if (cardInRow === 0) {
            cardInRow = 3;
            memberCanvas.appendChild(row);
            row = document.createElement("div");
            helper.appendClassList(row, ["member-row"]);
        }
        cardInRow-=1;

        var card = document.createElement("div");
        helper.appendClassList(card, ["member-card", "card", "text-bg-dark"]);
        var cardTop = document.createElement("div");
        var cardMid1 = document.createElement("div");
        var cardMid2 = document.createElement("div");
        var cardBot = document.createElement("div");

        helper.appendClassList(cardTop, ["card-header"]);
        setTopCardInfo(cardTop, v["badges"][0], v["badges"][1], v["name"], v["tag"], v["trophies"]);

        helper.appendClassList(cardMid1, ["card-body"]);
        setMidCard1Info(cardMid1, v, data["partFactors"], data["weekWarDay"]);

        helper.appendClassList(cardMid2, ["card-body", "graphs-wrapper"]);
        if (historyData[k]) {
            setMidCard2Info(cardMid2, historyData[k]);
        }
        else {
            setMidCard2Info(cardMid2, {"deckUseHistory":[0],"fameHistory":[0]});
        }

        helper.appendClassList(cardBot, ["card-footer"]);
        var historyBadges = [];
        try {
            historyBadges = history[v["tag"]]["historyBadges"];
        } catch (e) {};
        setBotCardInfo(cardBot, historyBadges.concat(v["badges"].splice(2)));

        card.appendChild(cardTop);
        card.appendChild(cardMid1);
        card.appendChild(cardBot); // dont feel like renaming variables after I decided to reorder these
        card.appendChild(cardMid2);

        row.appendChild(card);
    }
    memberCanvas.appendChild(row);
    //Set spinner status to 'off' (invisible)
    setLoaderVisibility(false);
}

function setLoaderVisibility(visible) {
    var spinner = document.getElementById("loading-spinner");
    if (visible && spinner.classList.contains("visually-hidden")) {
        spinner.classList.remove("visually-hidden");
    }
    else if (!spinner.classList.contains("visually-hidden")) {
        document.getElementById("loading-spinner").classList.add("visually-hidden");
    }
}

var data = null;
var historyData = null;
async function refreshData() {
    //Set spinner status to 'on' (visible)
    setLoaderVisibility(true);

    var dataTime = "";
    //Get most recent parsed data
    try {
        await fetch('./data/parsed_data.json').then((response) => {
            dataTime = response["headers"].get("last-modified");
            return response.json();
        }).then((json) => data = json);
    } catch (e) {
        window.alert(e);
        return;
    }

    //Get most recent historical data
    try {
        await fetch('./data/parsed_history.json').then((response) => {
            return response.json();
        }).then((json) => historyData = json);
    } catch (e) {
        window.alert(e);
        return;
    }

    //Initialize Order Button
    await initOrderButton(Object.keys(data["ordering"]));

    //Update the top of the webapp with clan metadata
    await updateMetadata(dataTime, data["tag"].substring(1), data["members"], data["description"], data["clanScore"], data["clanWarTrophies"], data["donationsPerWeek"]);

    //Populate Member Data
    await populateMemberList(data, historyData);

    //Set spinner status to 'off' (invisible)
    setLoaderVisibility(false);
}


//links popup
bootstrap.Toast.getOrCreateInstance(document.getElementById('liveToast')).show();   

refreshData();

//Set auto-refresh loop 300 * 1000 milliseconds (5 minutes)
setInterval(refreshData, 300000);
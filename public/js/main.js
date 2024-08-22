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
            populateMemberList(data);
        }
    };
    orderingSelector = orderingKeys[0];
}


async function populateMemberList(data) {
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

    function setTopCardInfo(info, status, name, tag, trophies) {
        var statusDiv = document.createElement("div");
        helper.appendClassList(statusDiv, ["card-header-sm"]);
        switch (status) {
            case "leader":
                statusDiv.appendChild(generateBadge(["fa-solid", "fa-chess-king"], "", "btn-light", "Crowned Dragon (Leader)", "right"));
                break;
            case "coleader":
                statusDiv.appendChild(generateBadge(["fa-solid", "fa-fire"], "", "btn-outline-warning", "Ancient Dragon (Co-Leader)", "right"));
                break;
            case "elder":
                statusDiv.appendChild(generateBadge(["fa-solid", "fa-fire-flame-curved"], "#f59042", "btn", "Elder Dragon (Elder)", "right"));
                break;
            case "member":
                statusDiv.appendChild(generateBadge(["fa-solid", "fa-egg"], "#ffffff", "btn", "Baby Dragon (Member)", "right"));
                break;
            default:
                break;
        }

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
        helper.appendClassList(trophiesDiv, ["card-header-med"]);
        trophiesDiv.appendChild(helper.generateIcon(["fa-solid", "fa-trophy"], "#ffe75c"));
        trophiesDiv.innerHTML += trophies;

        info.appendChild(statusDiv);
        info.appendChild(nameDiv);
        info.appendChild(trophiesDiv);
    }

    function setMidCardInfo(info, member, factors, wwd) {
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

    function setBotCardInfo(info, badges) {
        for (const badge of badges) {
            switch(badge) {
                case "standing-good":
                    info.appendChild(generateBadge(["fa-solid", "fa-circle-check"], "", "btn-outline-success", "Good standing!"));
                    break;
                case "standing-warning":
                    info.appendChild(generateBadge(["fa-solid", "fa-circle-exclamation"], "#ffbf00", "btn", "Not on track to hit medal quota."));
                    break;
                case "standing-violation":
                    info.appendChild(generateBadge(["fa-solid", "fa-circle-exclamation"], "", "btn-danger", "Cannot meet medal quota."));
                    break;
                case "ninek":
                    info.appendChild(generateBadge(["fa-solid", "fa-trophy"], "#ffe75c", "btn", "9000 Trophies!"));
                    break;
                case "cr-vet":
                    info.appendChild(generateBadge(["fa-solid", "fa-clock"], "#00cff3", "btn", "Level 55+"));
                    break;
                case "medals-threek":
                    info.appendChild(generateBadge(["fa-solid", "fa-dragon"], "", "btn-danger", "3000+ Weekly Medals!"));
                    break;
                case "medals-twohalfk":
                    info.appendChild(generateBadge(["fa-solid", "fa-dragon"], "", "btn-outline-danger", "2500+ Weekly Medals!"));
                    break;
                case "medals-twok":
                    info.appendChild(generateBadge(["fa-solid", "fa-dragon"], "#ff003e", "btn", "2000+ Weekly Medals!"));
                    break;
                case "donations-onek":
                    info.appendChild(generateBadge(["fa-solid", "fa-gift"], "", "btn-success", "1000+ Weekly Donations!"));
                    break;
                case "donations-sevenhalf":
                    info.appendChild(generateBadge(["fa-solid", "fa-gift"], "", "btn-outline-success", "750+ Weekly Donations!"));
                    break;
                case "donations-five":
                    info.appendChild(generateBadge(["fa-solid", "fa-gift"], "#00a00d", "btn", "500+ Weekly Donations!"));
                    break;
                case "decks-used-all":
                    info.appendChild(generateBadge(["fa-solid", "fa-copy"], "#0070ff", "btn", "All decks used today! (Includes training days)"));
                    break;
                case "top-medalist":
                    info.appendChild(generateBadge(["fa-solid", "fa-hand-fist"], "", "btn-danger", "#1 War Medal Earner: " + data["partFactors"]["meTop"] + " medals!"));
                    break;
                case "top-donor":
                    info.appendChild(generateBadge(["fa-solid", "fa-hand-holding-medical"], "", "btn-success", "#1 Donor: " + data["partFactors"]["doTop"] + " donations!"));
                    break;
                default:
                    break;
            }
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
        var cardMid = document.createElement("div");
        var cardBot = document.createElement("div");

        helper.appendClassList(cardTop, ["card-header"]);
        setTopCardInfo(cardTop, v["badges"][0], v["name"], v["tag"], v["trophies"]);

        helper.appendClassList(cardMid, ["card-body"]);
        setMidCardInfo(cardMid, v, data["partFactors"], data["weekWarDay"]);

        helper.appendClassList(cardBot, ["card-footer"]);
        setBotCardInfo(cardBot, v["badges"]);

        card.appendChild(cardTop);
        card.appendChild(cardMid);
        card.appendChild(cardBot);

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

    //Initialize Order Button
    await initOrderButton(Object.keys(data["ordering"]));

    //Update the top of the webapp with clan metadata
    await updateMetadata(dataTime, data["tag"].substring(1), data["members"], data["description"], data["clanScore"], data["clanWarTrophies"], data["donationsPerWeek"]);

    //Populate Member Data
    await populateMemberList(data);

    //Set spinner status to 'off' (invisible)
    setLoaderVisibility(false);
}


//links popup
bootstrap.Toast.getOrCreateInstance(document.getElementById('liveToast')).show();

refreshData();

//Set auto-refresh loop 300 * 1000 milliseconds (5 minutes)
setInterval(refreshData, 300000);
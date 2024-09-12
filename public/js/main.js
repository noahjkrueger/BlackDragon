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

async function updateActivityMap(activity) {
    function zArray(day) {
        function parseTime(timeStr) {
            const hr = parseInt(timeStr.substring(9, 11));
            const min = parseInt(timeStr.substring(11, 13)) / 60;
            return hr + min;
        }
        var zArr = Array(96).fill().map((_, index) => 0);
        for (i=0; i<day.length; i+=1) {
            const t = parseTime(day[i]);
            zArr[Math.floor(t / 0.25)] += 1;
        }
        return zArr;
    }
    var labels = [];
    for (var i=0; i<24; i+=1) {
        labels.push(i+":00");
        labels.push(i+":15");
        labels.push(i+":30");
        labels.push(i+":45");
    }
    document.getElementById("metadata-activity-map").innerHTML = "";
    var options = {
        plotOptions: {
            heatmap: {
                enableShades: false,
                useFillColorAsStroke: true,
                colorScale: {
                    ranges: [
                        {
                            from: 0,
                            to: 0,
                            color: '#000000',
                            name: "No Logins",
                        },
                        {
                            from: 1,
                            to: 2,
                            color: '#212224',
                            name: "1-2 Logins",
                        },
                        {
                            from: 3,
                            to: 5,
                            color: '#462022',
                            name: "3-5 Logins",
                        },
                        {
                            from: 6,
                            to: 8,
                            color: '#6B1F20',
                            name: "6-8 Logins",
                        },
                        {
                            from: 9,
                            to: 11,
                            color: '#8F1D1E',
                            name: "9-11 Logins",
                        },
                        {
                            from: 11,
                            to: 13,
                            color: '#B41C1C',
                            name: "11-13 Logins",
                        },
                        {
                            from: 14,
                            to: Infinity,
                            color: '#D91A1A',
                            name: "14+ Logins",
                        },
                    ]
                },
            }
        },
        series: [
            {
                name: 'Sunday',
                data: zArray(activity["day-0"])
            },
            {
                name: 'Monday',
                data: zArray(activity["day-1"])
            },
            {
                name: 'Tuesday',
                data: zArray(activity["day-2"])
            },
            {
                name: 'Wednesday',
                data: zArray(activity["day-3"])
            },
            {
                name: 'Thursday',
                data: zArray(activity["day-4"])
            },
            {
                name: 'Friday',
                data: zArray(activity["day-5"])
            },
            {
                name: 'Saturday',
                data: zArray(activity["day-6"])
            },
        ],
        yaxis: {
            labels: {
                style: {
                    fontFamily: "'Courier New, Courier, monospace",
                    colors:  '#ffffff'
                },
            }
        },
        xaxis: {
            categories: labels,
            labels: {
                style: {
                    fontFamily: "'Courier New, Courier, monospace",
                    colors:  '#ffffff'
                },
            },
            tickAmount: 24,

        },
        chart: {
            height: 230,
            type: 'heatmap',
            toolbar: {
                show: false,
            }, 
            animations: {
                enabled: false,
            },
        },
        tooltip: {
            enabled: true,
            theme: "dark"
        },
        dataLabels: {
            enabled: false,
        },
        legend: {
            fontFamily: 'Courier New, Courier, monospace',
            labels: {
                colors: "#ffffff"
            },
            floating: true,
        },
    };
    var chart = new ApexCharts(document.getElementById("metadata-activity-map"), options);
    chart.render();
}

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
            case "history-medals-2200":
                return generateBadge(["fa-solid", "fa-khanda"], "#ff0000", "btn", "Averages over 2200 Medals per Week!");
            case "history-medals-2500":
                return generateBadge(["fa-solid", "fa-khanda"], "", "btn-outline-danger", "Averages over 2500 Medals per week!");
            case "history-medals-3000":
                return generateBadge(["fa-solid", "fa-khanda"], "", "btn-danger", "Averages over 3000 Medals per week!");
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
        function createGraph(parent, title, dataPoints_ME, dataPoints_DE, averageLineColor, lineColor_ME, lineColor_DE) {
            var g = document.createElement("div");
            parent.appendChild(g);
            const average_ME = dataPoints_ME.reduce((sum, i) => {return sum + i}) / dataPoints_ME.length;
            const avgarr_ME = Array(dataPoints_ME.length).fill(0).map((_, i) => {return average_ME;});
            const average_DE = dataPoints_DE.reduce((sum, i) => {return sum + i}) / dataPoints_DE.length;
            const avgarr_DE = Array(dataPoints_DE.length).fill(0).map((_, i) => {return average_DE;});
            const labels = Array(dataPoints_ME.length).fill().map((_, index) => `-${dataPoints_ME.length-index} Wars`);
            var options = {
                series: [
                    {
                        name: 'Average Decks',
                        data: avgarr_DE
                    },
                    {
                        name: 'Decks Used',
                        data: dataPoints_DE
                    },
                    {
                        name: 'Average Medals',
                        data: avgarr_ME
                    },
                    {
                        name: 'Medals Gained',
                        data: dataPoints_ME
                    },
                ],
                chart: {
                    height: 250,
                    type: 'line',
                    stacked: false,
                    toolbar: {
                        show: false,
                    },           
                },
                yaxis: [
                    {
                        decimalsInFloat: 0,
                        opposite: true,
                        axisTicks: {
                            show: true
                        },
                        axisBorder: {
                            show: true,
                            color: lineColor_DE
                        },
                        labels: {
                            style: {
                                fontFamily: "'Courier New, Courier, monospace",
                                colors: "#ffffff"
                            }
                        },
                        min: 0,
                        max: 16
                    },
                    {
                        show: false,
                        min: 0,
                        max: 16
                    },
                    {
                        decimalsInFloat: 0,
                        axisTicks: {
                            show: true
                        },
                        axisBorder: {
                            show: true,
                            color: lineColor_ME,
                        },
                        labels: {
                            style: {
                                fontFamily: "'Courier New, Courier, monospace",
                                colors: "#ffffff"
                            }
                        },
                        min: 0,
                        max: 3600
                    },
                    {
                        show: false,
                        min: 0,
                        max: 3600
                    },
                ],
                xaxis: {
                    categories: labels,
                    labels: {
                        style: {
                            fontFamily: "'Courier New, Courier, monospace",
                            colors:  '#ffffff'
                          },
                    }
                },
                colors: [averageLineColor, lineColor_DE, averageLineColor, lineColor_ME],
                title: {
                    text: title,
                    align: "center",
                    style: {
                        fontFamily: "'Courier New, Courier, monospace",
                        color:  '#ffffff',
                      },
                },
                legend: {
                    show: false
                },
                grid: {
                    show: false,
                },
                tooltip: {
                    enabled: true,
                    theme: "dark"
                },
                markers: {
                    size: 1,
                },
                stroke: {
                    width: 4,
                },                  
            };
            var chart = new ApexCharts(g, options);
            chart.render();
        }

        const deckUsage = history["deckUseHistory"].slice().reverse();
        const medalGains = history["fameHistory"].slice().reverse();
        var graphs = document.createElement("div");
        info.appendChild(graphs);
        createGraph(graphs, "War Statistics", medalGains, deckUsage, "#ffffff", "#ff0000","#0070ff");
        window.dispatchEvent(new Event("resize")); //weird ApexChart quirk workaround
    }

    function setBotCardInfo(info, badges) {
        for (const badge of badges) {
            info.appendChild(getBadge(badge));
        }
    }
    
    var memberCanvas = document.getElementById("member-canvas");
    memberCanvas.innerHTML = "";

    //Get current ordering
    const order = data["ordering"][orderingSelector];
    const members = data["memberList"];

    var cardInRow = 0;
    var row = null;
    for (const k of order) {
        const v = members[k];
        if (cardInRow === 0) {
            cardInRow = 3; //how many cards per row
            row = document.createElement("div");
            helper.appendClassList(row, ["member-row"]);
            memberCanvas.appendChild(row);
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
var activityData = null;
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

    //Get most recent activity data
    try {
        await fetch('./data/activity.json').then((response) => {
            return response.json();
        }).then((json) => activityData = json);
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

    //Update activity graph
    await updateActivityMap(activityData);

    //Set spinner status to 'off' (invisible)
    setLoaderVisibility(false);
}


//links popup
bootstrap.Toast.getOrCreateInstance(document.getElementById('liveToast')).show();   

refreshData();
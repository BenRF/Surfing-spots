var pos = "";
if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(showPosition);
} else {
    alert("Geolocation is not supported by this browser.");
}

function showPosition(position) {
    pos = position;
    document.getElementById("location").innerHTML = position.coords.latitude + ", " + position.coords.longitude;
}

var currentSkillSelected = null;
function selectSkill(skill) {
    var skills = ["novice","intermediate","expert"];
    for (var i = 0; i < 3; i++) {
        document.getElementById(skills[i]).className = "skill " + skills[i] + " faded";
    }
    currentSkillSelected = skill;
    document.getElementById(currentSkillSelected).className = "skill " + currentSkillSelected + " selectedSkill";
    checkInputs();
}

var latitudeSelected = null;
var longtitudeSelected = null;
function selectLocation(location) {
    document.getElementById("browserLocation").className = "locationOption faded";
    document.getElementById("customLocation").className = "locationOption faded";
    if (location == 1) {
        latitudeSelected = pos.coords.latitude;
        longtitudeSelected = pos.coords.longitude;
        document.getElementById("browserLocation").className = "locationOption selected";
    } else {
        latitudeSelected = document.getElementById("latInput").value;
        longtitudeSelected = document.getElementById("longInput").value;
        document.getElementById("customLocation").className = "locationOption selected";
    }
    checkInputs();
}

function checkInputs() {
    if (currentSkillSelected !== null && latitudeSelected !== null && longtitudeSelected !== null) {
        var button = document.getElementById("submit");
        button.disabled = false;
        button.className = "btn";
    }
}

function requestSpots() {
    var xmlHttp = new XMLHttpRequest();
    var url = "http://localhost:8080/?lat=" + latitudeSelected + "&long=" + longtitudeSelected + "&skill=" + currentSkillSelected;
    xmlHttp.onreadystatechange = function() {
    if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
        findSpots(xmlHttp.responseText);
    }
    xmlHttp.open("GET", url, true);
    xmlHttp.send(null);
}

var timer;
var surfingSpots;
function findSpots(spots) {
    var styledMap = new google.maps.StyledMapType([
        {"elementType": "geometry","stylers": [{"color": "#ebe3cd"}]},
        {"elementType": "labels.text.fill","stylers": [{"color": "#523735"}]},
        {"elementType": "labels.text.stroke","stylers": [{"color": "#f5f1e6"}]},
        {"featureType": "administrative","elementType": "geometry.stroke","stylers": [{"color": "#c9b2a6"}]},
        {"featureType": "administrative.land_parcel","elementType": "geometry.stroke","stylers": [{"color": "#dcd2be"}]},
        {"featureType": "administrative.land_parcel","elementType": "labels","stylers": [{"visibility": "off"}]},
        {"featureType": "administrative.land_parcel","elementType": "labels.text.fill","stylers": [{"color": "#ae9e90"}]},
        {"featureType": "landscape.natural","elementType": "geometry","stylers": [{"color": "#dfd2ae"}]},
        {"featureType": "poi","elementType": "geometry","stylers": [{"color": "#dfd2ae"}]},
        {"featureType": "poi","elementType": "labels.text","stylers": [{"visibility": "off"}]},
        {"featureType": "poi","elementType": "labels.text.fill","stylers": [{"color": "#93817c"}]},
        {"featureType": "poi.business","stylers": [{"visibility": "off"}]},
        {"featureType": "poi.park","elementType": "geometry.fill","stylers": [{"color": "#a5b076"}]},
        {"featureType": "poi.park","elementType": "labels.text","stylers": [{"visibility": "off"}]},
        {"featureType": "poi.park","elementType": "labels.text.fill","stylers": [{"color": "#447530"}]},
        {"featureType": "road","elementType": "geometry","stylers": [{"color": "#f5f1e6"}]},
        {"featureType": "road.arterial","elementType": "geometry","stylers": [{"color": "#fdfcf8"}]},
        {"featureType": "road.arterial","elementType": "labels","stylers": [{"visibility": "off"}]},
        {"featureType": "road.highway","elementType": "geometry","stylers": [{"color": "#f8c967"}]},
        {"featureType": "road.highway","elementType": "geometry.stroke","stylers": [{"color": "#e9bc62"}]},
        {"featureType": "road.highway","elementType": "labels","stylers": [{"visibility": "off"}]},
        {"featureType": "road.highway.controlled_access","elementType": "geometry","stylers": [{"color": "#e98d58"}]},
        {"featureType": "road.highway.controlled_access","elementType": "geometry.stroke","stylers": [{"color": "#db8555"}]},
        {"featureType": "road.local","stylers": [{"visibility": "off"}]},
        {"featureType": "road.local","elementType": "labels","stylers": [{"visibility": "off"}]},
        {"featureType": "road.local","elementType": "labels.text.fill","stylers": [{"color": "#806b63"}]},
        {"featureType": "transit.line","elementType": "geometry","stylers": [{"color": "#dfd2ae"}]},
        {"featureType": "transit.line","elementType": "labels.text.fill","stylers": [{"color": "#8f7d77"}]},
        {"featureType": "transit.line","elementType": "labels.text.stroke","stylers": [{"color": "#ebe3cd"}]},
        {"featureType": "transit.station","elementType": "geometry","stylers": [{"color": "#dfd2ae"}]},
        {"featureType": "water","elementType": "geometry.fill","stylers": [{"color": "#b9d3c2"}]},
        {"featureType": "water","elementType": "labels.text.fill","stylers": [{"color": "#92998d"}]}
    ],
        {name: 'Styled Map'}
    );
    map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: latitudeSelected, lng: longtitudeSelected},
        zoom: 8,
        zoomControl: true,
        zoomControlOptions: {
        position: google.maps.ControlPosition.TOP_RIGHT
        },
        mapTypeControl: false,
        scaleControl: false,
        streetViewControl: false,
        rotateControl: false,
        fullscreenControl: false
    });
    map.mapTypes.set('styled_map', styledMap);
    map.setMapTypeId('styled_map');
    var marker = new google.maps.Marker({
        icon: "http://benrf.co.uk/here.png",
        draggable: false,
        position: {lat: latitudeSelected, lng: longtitudeSelected},
        map: map,
    });
    surfingSpots = JSON.parse(spots);
    timer = setTimeout(addResults,750,surfingSpots);
    document.getElementById("title").className = "productTitle pageTwo";
    document.getElementById("pageOne").className = "skillSelect leftScreen";
    document.getElementById("pageTwo").className = "resultScreen";
}

var count = 0;
function addResults(spots) {
    clearTimeout(timer);
    addResult(spots[count],count);
    count++;
    if (count < spots.length) {
        timer = setTimeout(addResults,50,spots,);
    }
}

var markers = [];
function addResult(spot,count) {
    var resultBox = document.getElementById("spots");
    var labels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    var physical = removeDecimalPoint("" + spot[2]);
    var wind = removeDecimalPoint("" + spot[3]);
    var distance = spot[1];
    spot = spot[0];
    var container = document.createElement("div");
    container.id = "spot_" + count;
    container.className = "spot";
    container.onmouseover = function() {focusMarker(count);};
    container.onmouseout=  function() {setAllMarkersOpacity(1)};
    var textElement = document.createElement("p");
    textElement.className = "spotName";
    var text = document.createTextNode(spot.spot_name + " - ");
    textElement.append(text);
    var travelTime = document.createElement("b");
    travelTime.className = "spotTravelTime";
    var travelText = document.createTextNode(distance.text);
    travelTime.append(travelText);
    textElement.append(travelTime);
    container.append(textElement);
    var distanceIcon = document.createElement("img");
    distanceIcon.src = "http://benrf.co.uk/distance.png";
    distanceIcon.className = "distanceIcon";
    container.append(distanceIcon);
    var distanceText = document.createElement("p");
    distanceText.className = "distanceVal";
    distanceText.innerHTML = physical + "km";
    container.append(distanceText);
    var windIcon = document.createElement("img");
    windIcon.src = "http://benrf.co.uk/wind.jpg";
    windIcon.className = "windIcon";
    container.append(windIcon);
    var windText = document.createElement("p");
    windText.className = "distanceVal";
    windText.innerHTML = wind + " knots";
    container.append(windText);
    resultBox.append(container);
    var marker;
    if (count < labels.length) {
        marker = new google.maps.Marker({
        animation: google.maps.Animation.DROP,
        draggable: false,
        // label: labels[count],
        position: {lat: parseFloat(spot.latitude), lng: parseFloat(spot.longitude)},
        map: map,
        });
    } else {
        marker = new google.maps.Marker({
        animation: google.maps.Animation.DROP,
        draggable: false,
        position: {lat: parseFloat(spot.latitude), lng: parseFloat(spot.longitude)},
        map: map,
        });
    }
    marker.addListener('mouseover', function() {
        focusSpot(count)
    });
    marker.addListener('mouseout', function() {
        unfocusSpot(count);
    });
    markers.push(marker);
}

function focusSpot(id) {
    document.getElementById("spot_" + id).className = "spot focused";
}

function unfocusSpot(id) {
    document.getElementById("spot_" + id).className = "spot";
}

function focusMarker(id) {
    setAllMarkersOpacity(0.1)
    markers[id].setOpacity(1);
}

function setAllMarkersOpacity(val) {
    for (var i = 0; i < markers.length; i++) {
        markers[i].setOpacity(val);
    }
}

function removeDecimalPoint(value) {
    return value.substring(0,value.indexOf("."));
}

function wipeResults() {
    document.getElementById("spots").innerHTML = "";
    for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(null);
    }
    markers = [];
}

function orderResults() {
    count = 0;
    var sortingBy = document.getElementById("sortBy").value;
    if (sortingBy === "physical") {
        surfingSpots = surfingSpots.sort(compareDistance);
    } else if (sortingBy === "time") {
        surfingSpots = surfingSpots.sort(compareTime);
    } else {
        surfingSpots = surfingSpots.sort(compareWind).reverse();
    }
    wipeResults();
    addResults(surfingSpots);
}

function compareTime(spot1,spot2) {
    var spot1Val = spot1[1].value;
    var spot2Val = spot2[1].value;
    return compare(spot1Val,spot2Val);
}

function compareDistance(spot1,spot2) {
    var spot1Val = spot1[2];
    var spot2Val = spot2[2];
    return compare(spot1Val,spot2Val);
}

function compareWind(spot1,spot2) {
    var spot1Val = spot1[3];
    var spot2Val = spot2[3];
    return compare(spot1Val,spot2Val);
}

function compare(val1,val2) {
    if (val1 < val2) {
        return -1;
    } else if (val1 > val2) {
        return 1;
    } else {
        return 0;
    }
}

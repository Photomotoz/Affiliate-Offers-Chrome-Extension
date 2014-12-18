
var microsecondsPerWeek = 1000 * 60 * 60 * 24 * 7;
//How far back we look in the user's history
var twoWeeksAgo = (new Date).getTime() - microsecondsPerWeek*2;
//Max number of URLs we wanna fetch
var maxSearch = 1000;   
//How often we check history for changes.
var dataPeriod = microsecondsPerWeek/2;
//The list that contains the history data for each matched affiliate URL
var matchedHistoryList = [];

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {

    if(request.type == 'user'){

        getUser(function(userID){

            sendResponse(userID);

        });
    }

    if(request.type == 'history'){
        //Check save data, if older than a week, refresh.
        getMatchedAffiliates(function(oldData){

            if(oldData!=null){
               
                sendResponse(oldData);
                return;
            }

            var urls = request.link;
            matchedHistoryList = [];
            //Get all domains user has visited along with number of visits
            for(var obj in urls){

                searchHistory(obj, urls, sendResponse);
            }

        });
    }
    return true;
});


function searchHistory(index, urls, res){

    var url = urls[index].domain;

    chrome.history.search({text: url ,startTime: twoWeeksAgo, maxResults : maxSearch}, function(historyItems) {

        //We found something
        if(historyItems.length > 0){

            //Send message back 
            matchedHistoryList.push( {hits: historyItems.length, domain: url, lastVisit: historyItems[0].lastVisitTime} );
        }
        else{

            matchedHistoryList.push({hits: 0, domain : url, lastVisit : null});
        }        
        //We're done.
        if(matchedHistoryList.length == urls.length){

            var response = matchedHistoryList.sort(compareHistoryHits).slice(0, 3 > matchedHistoryList.length ? matchedHistoryList.length : 3).sort(compareHistoryTime);
            saveMatchedAffiliates(response);
            res(response);  
        }


    });

}


function saveMatchedAffiliates(sortedList){

    var saveData = {};
    saveData.affiliates = sortedList;
    saveData.storeDate = (new Date).getTime();

    chrome.storage.sync.set({'affiliate_data': saveData}, function() {
        console.log('Settings saved');
    });
}


function getMatchedAffiliates(callback){

    var currentTime = (new Date).getTime();

    chrome.storage.sync.get('affiliate_data', function(value) {

        //Data is too old or no data
        if(value == null || (currentTime - value.affiliateData.storeDate) > (dataPeriod) ){
            callback(null);
        }
        else{
            callback(value.affiliateData.affiliates);
        }
    });
}

function compareHistoryHits(a,b){

    if (a.hits < b.hits){
      return -1;
    }
    if (a.hits > b.hits){
      return 1;
    }
    return 0;
}

function compareHistoryTime(a,b){

    if (a.lastVisit < b.lastVisit){
      return 1;
    }
    if (a.lastVisit > b.lastVisit){
      return -1;
    }
    return 0;
}

function getUser(callback){

    chrome.storage.sync.get('affiliate_user_id', function(data) {

        if(data.vulcun_user_id == null) {

           var userId = generateUUID();

            chrome.storage.sync.set({'affiliate_user_id': userId}, function() {
                callback(userId);
            });

        }
        else{

            callback(data.vulcun_user_id);
        }
    });
}

function generateUUID(){
    var d = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (d + Math.random()*16)%16 | 0;
        d = Math.floor(d/16);
        return (c=='x' ? r : (r&0x3|0x8)).toString(16);
    });
    return uuid;
};